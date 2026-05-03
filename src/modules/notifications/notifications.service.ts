import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/mongoose'
import { Types, type Model, type PipelineStage } from 'mongoose'
import { TypeNotify } from 'enums/common'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { NotificationService } from 'modules/notifications/notification.service'
import { isExpoPushToken } from 'modules/notifications/push/send-notify'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'

const extractOptionalUserId = (authorization: string | undefined, jwtService: JwtService, jwtSecret: string) => {
  const [type, token] = authorization?.split(' ') ?? []
  if (type !== 'Bearer' || !token) return undefined
  try {
    return jwtService.verify<TokenPayload>(token, { secret: jwtSecret }).userId?.toString()
  } catch {
    return undefined
  }
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @Inject(NotificationService) private readonly notificationService: NotificationService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @InjectModel(MODEL_NAMES.accountToken) private readonly accountTokenModel: Model<IAccountToken>,
    @InjectModel(MODEL_NAMES.notificationInbox) private readonly notificationInboxModel: Model<INotificationInbox>,
    @InjectModel(MODEL_NAMES.pushDevice) private readonly pushDeviceModel: Model<IPushDevice>,
    @InjectModel(MODEL_NAMES.notification) private readonly notifyModel: Model<any>
  ) {}

  async registerDevice(payload: Record<string, unknown>, authorization?: string) {
    const rawToken =
      typeof payload.pushToken === 'string'
        ? payload.pushToken
        : typeof payload.expoPushToken === 'string'
          ? payload.expoPushToken
          : typeof payload.fcmToken === 'string'
            ? payload.fcmToken
            : ''
    const token = rawToken.trim()
    if (!token || !isExpoPushToken(token)) throw new BadRequestException('Invalid Expo push token')

    const accountId = extractOptionalUserId(authorization, this.jwtService, this.configService.get<string>('app.jwt.secret') || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2')
    const setFields: Record<string, unknown> = { active: true, lastSeenAt: new Date(), deletedAt: null }
    ;['platform', 'appVersion', 'deviceName'].forEach((key) => {
      if (typeof payload[key] === 'string' && payload[key].trim()) setFields[key] = payload[key].trim()
    })
    if (typeof payload.notificationEnabled === 'boolean') setFields.notificationEnabled = payload.notificationEnabled
    if (accountId) setFields.accountId = accountId

    const device = await this.pushDeviceModel.findOneAndUpdate({ token }, { $set: setFields, $setOnInsert: { token } }, { upsert: true, new: true }).exec()
    if (accountId) {
      await this.accountTokenModel.updateMany({ accountId: { $ne: accountId }, fcmToken: token }, { $unset: { fcmToken: 1 } })
      await this.accountTokenModel.findOneAndUpdate({ accountId }, { fcmToken: token }).exec()
    }
    return { record: device, message: 'OK' }
  }

  listCms(query: CrudListQuery) {
    return this.crud.list(this.notifyModel, query, { searchFields: ['name', 'description', 'content'] })
  }

  getCms(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.notifyModel, id, {}, includeDeleted)
  }

  async createCms(payload: Record<string, unknown>) {
    const { notification, inboxCount, audienceCount } = await this.notificationService.createNotificationWithAudience(payload)
    return { record: notification, inboxCount, audienceCount, message: 'Created' }
  }

  updateCms(id: string, payload: Record<string, unknown>, replace = false) {
    return this.crud.update(this.notifyModel, id, payload, replace)
  }

  deleteCms(id: string) {
    return this.crud.softDelete(this.notifyModel, id)
  }

  restoreCms(id: string) {
    return this.crud.restore(this.notifyModel, id)
  }

  listDevices(query: CrudListQuery) {
    return this.crud.list(this.pushDeviceModel, query, { searchFields: ['token', 'deviceName', 'platform'] })
  }

  updateDevice(id: string, payload: Record<string, unknown>, replace = false) {
    return this.crud.update(this.pushDeviceModel, id, payload, replace)
  }

  deleteDevice(id: string) {
    return this.crud.softDelete(this.pushDeviceModel, id)
  }

  async getInbox(userId: string, query: CrudListQuery) {
    const { limit, page, skip } = this.crud.parsePagination(query)
    const type = typeof query.type === 'string' && query.type !== TypeNotify.All ? query.type : undefined
    const accountId = new Types.ObjectId(userId)
    const notificationMatch = type ? { 'notification.type': type } : {}
    const deletedMatch = query.onlyDeleted === 'true' ? { deletedAt: { $ne: null } } : { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }
    const basePipeline: PipelineStage[] = [
      { $match: { accountId, ...deletedMatch } },
      { $lookup: { from: 'notifications', localField: 'notification', foreignField: '_id', as: 'notification' } },
      { $unwind: '$notification' },
      { $match: notificationMatch }
    ]
    const listPipeline: PipelineStage[] = [
      ...basePipeline,
      { $sort: { createdAt: -1 as const } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: '$notification._id',
          inboxId: '$_id',
          name: '$notification.name',
          imageUrl: '$notification.imageUrl',
          videoUrl: '$notification.videoUrl',
          description: '$notification.description',
          content: '$notification.content',
          type: '$notification.type',
          createdAt: '$notification.createdAt',
          updatedAt: '$notification.updatedAt',
          read: { $cond: [{ $ifNull: ['$readAt', false] }, true, false] },
          readAt: 1,
          deliveredAt: 1,
          deletedAt: 1
        }
      }
    ]
    const [countResult, list] = await Promise.all([
      this.notificationInboxModel.aggregate([...basePipeline, { $count: 'total' }]),
      this.notificationInboxModel.aggregate(listPipeline)
    ])
    const total = countResult[0]?.total || 0
    return { list, limit, total, page, totalPages: Math.ceil(total / limit), message: 'OK' }
  }

  async markRead(userId: string, notificationId: string) {
    if (!Types.ObjectId.isValid(notificationId)) throw new BadRequestException('Invalid notification id')
    const notification = await this.notifyModel.findById(notificationId).select('_id').exec()
    if (!notification) throw new NotFoundException('Notification not found')
    const now = new Date()
    const inbox = await this.notificationInboxModel
      .findOneAndUpdate(
        { notification: notificationId, accountId: userId },
        { $set: { readAt: now }, $setOnInsert: { notification: notificationId, accountId: userId } },
        { upsert: true, new: true }
      )
      .exec()
    await this.notifyModel.findByIdAndUpdate(notificationId, { $addToSet: { read: userId } }).exec()
    return { message: 'Notification read status updated', notification: inbox }
  }

  async deleteFromInbox(userId: string, notificationId: string) {
    if (!Types.ObjectId.isValid(notificationId)) throw new BadRequestException('Invalid notification id')
    const notification = await this.notifyModel.findById(notificationId).select('_id').exec()
    if (!notification) throw new NotFoundException('Notification not found')
    const inbox = await this.notificationInboxModel
      .findOneAndUpdate(
        { notification: notificationId, accountId: userId },
        { $set: { deletedAt: new Date() }, $setOnInsert: { notification: notificationId, accountId: userId } },
        { upsert: true, new: true }
      )
      .exec()
    await this.notifyModel.findByIdAndUpdate(notificationId, { $addToSet: { deleteBy: userId } }).exec()
    return { record: inbox, message: 'OK' }
  }

  async restoreInbox(userId: string, notificationId: string) {
    if (!Types.ObjectId.isValid(notificationId)) throw new BadRequestException('Invalid notification id')
    const inbox = await this.notificationInboxModel
      .findOneAndUpdate({ notification: notificationId, accountId: userId }, { $set: { deletedAt: null } }, { new: true })
      .exec()
    if (!inbox) throw new NotFoundException('Inbox notification not found')
    return { record: inbox, message: 'OK' }
  }
}
