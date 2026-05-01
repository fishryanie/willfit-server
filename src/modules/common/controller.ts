import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { Types, type PipelineStage } from 'mongoose'
import { accountTokenModel, notificationInboxModel, pushDeviceModel } from 'models'
import { TypeNotify } from 'enums/common'
import { isExpoPushToken } from 'modules/notifications/sendNotify'
import { createNotificationWithAudience } from 'modules/notifications/notificationService'
import { contactModel, notifyModel } from './models'

const extractOptionalUserId = (authorization?: string) => {
  const [type, token] = authorization?.split(' ') ?? []
  if (type !== 'Bearer' || !token) {
    return undefined
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2') as TokenPayload
    return payload.userId
  } catch {
    return undefined
  }
}

export const registerPushDevice = async (req: Request, res: Response) => {
  // #swagger.tags = ['Notifications']
  try {
    const { pushToken, expoPushToken, fcmToken, platform, appVersion, deviceName, notificationEnabled } = req.body ?? {}
    const rawToken =
      typeof pushToken === 'string' ? pushToken : typeof expoPushToken === 'string' ? expoPushToken : typeof fcmToken === 'string' ? fcmToken : ''
    const token = rawToken.trim()
    if (!token || !isExpoPushToken(token)) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid Expo push token' })
      return
    }
    const optionalUserId = extractOptionalUserId(req.headers.authorization)
    const setFields: Record<string, unknown> = {
      active: true,
      lastSeenAt: new Date()
    }
    if (typeof platform === 'string' && platform.trim()) {
      setFields.platform = platform.trim()
    }
    if (typeof appVersion === 'string' && appVersion.trim()) {
      setFields.appVersion = appVersion.trim()
    }
    if (typeof deviceName === 'string' && deviceName.trim()) {
      setFields.deviceName = deviceName.trim()
    }
    if (typeof notificationEnabled === 'boolean') {
      setFields.notificationEnabled = notificationEnabled
    }
    if (optionalUserId) {
      setFields.accountId = optionalUserId
    }
    const device = await pushDeviceModel
      .findOneAndUpdate({ token }, { $set: setFields, $setOnInsert: { token } }, { upsert: true, new: true })
      .select('token accountId deviceName active notificationEnabled lastSeenAt')
      .exec()
    if (optionalUserId) {
      await accountTokenModel.updateMany({ accountId: { $ne: optionalUserId }, fcmToken: token }, { $unset: { fcmToken: 1 } })
      await accountTokenModel.findOneAndUpdate({ accountId: optionalUserId }, { fcmToken: token }).exec()
    }
    res.status(StatusCodes.OK).send({
      message: ReasonPhrases.OK,
      record: {
        token: device.token,
        active: device.active,
        notificationEnabled: device.notificationEnabled,
        deviceName: device.deviceName ?? null,
        accountId: device.accountId ?? null,
        lastSeenAt: device.lastSeenAt
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

const parsePagination = (req: Request, defaultLimit = 20) => {
  const rawLimit = Number(req.query.limit)
  const rawPage = Number(req.query.page)
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit, 100)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  return { limit, page, skip: (page - 1) * limit }
}

const getNotificationUserId = (req: TokenVerifiedRequest) => {
  return req.tokenVerified?.userId?.toString()
}

const getNotificationType = (req: Request) => {
  return typeof req.query.type === 'string' && req.query.type !== TypeNotify.All ? req.query.type : undefined
}

export const createCmsNotification = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Notifications']
  try {
    const { notification, inboxCount, audienceCount } = await createNotificationWithAudience(req.body ?? {})
    res.status(StatusCodes.CREATED).send({
      record: notification,
      inboxCount,
      audienceCount,
      message: ReasonPhrases.CREATED
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const getNotifyByUser = async (req: TokenVerifiedRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }
    const { limit, page, skip } = parsePagination(req)
    const type = getNotificationType(req)
    const accountId = new Types.ObjectId(userId)
    const notificationMatch = type ? { 'notification.type': type } : {}
    const basePipeline: PipelineStage[] = [
      { $match: { accountId, deletedAt: { $exists: false } } },
      {
        $lookup: {
          from: 'notifications',
          localField: 'notification',
          foreignField: '_id',
          as: 'notification'
        }
      },
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
          deliveredAt: 1
        }
      }
    ]
    const [countResult, list] = await Promise.all([
      notificationInboxModel.aggregate([...basePipeline, { $count: 'total' }]),
      notificationInboxModel.aggregate(listPipeline)
    ])
    const total = countResult[0]?.total || 0
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, page, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
  // #swagger.tags = ['Notifications']
}

export const updateReadNotification = async (req: TokenVerifiedRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    const notificationId = req.params.id
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }
    if (!Types.ObjectId.isValid(notificationId)) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid notification id' })
      return
    }

    const notification = await notifyModel.findById(notificationId).select('_id').exec()
    if (!notification) {
      res.status(StatusCodes.NOT_FOUND).send({ message: 'Notification not found' })
      return
    }

    const now = new Date()
    const inbox = await notificationInboxModel
      .findOneAndUpdate(
        { notification: notificationId, accountId: userId },
        { $set: { readAt: now }, $setOnInsert: { notification: notificationId, accountId: userId } },
        { upsert: true, new: true }
      )
      .exec()
    await notifyModel.findByIdAndUpdate(notificationId, { $addToSet: { read: userId } }).exec()
    res.status(StatusCodes.OK).send({ message: 'Notification read status updated', notification: inbox })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
  // #swagger.tags = ['Notifications']
}

export const userDeleteNotification = async (req: TokenVerifiedRequest, res: Response) => {
  try {
    const userId = getNotificationUserId(req)
    const notificationId = req.params.id
    if (!userId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }
    if (!Types.ObjectId.isValid(notificationId)) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid notification id' })
      return
    }
    const notification = await notifyModel.findById(notificationId).select('_id').exec()
    if (!notification) {
      res.status(StatusCodes.NOT_FOUND).send({ message: 'Notification not found' })
      return
    }

    await Promise.all([
      notificationInboxModel
        .findOneAndUpdate(
          { notification: notificationId, accountId: userId },
          { $set: { deletedAt: new Date() }, $setOnInsert: { notification: notificationId, accountId: userId } },
          { upsert: true, new: true }
        )
        .exec(),
      notifyModel.findByIdAndUpdate(notificationId, { $addToSet: { deleteBy: userId } }).exec()
    ])
    res.status(StatusCodes.OK).send({ message: StatusCodes.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
  // #swagger.tags = ['Notifications']
}

export const findContactList = async (req: Request, res: Response) => {
  // #swagger.tags = ['Contact']
  try {
    const status = req.query.status || 'all'
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    const filter = status !== 'all' && typeof status === 'string' ? { type: status } : {}
    const [total, list] = await Promise.all([
      contactModel.countDocuments(filter as any).exec(),
      contactModel.find(filter as any).select('-__v').sort({ createdAt: 1 }).skip(skip).limit(limit).exec()
    ])
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const createNewContact = async (req: Request, res: Response) => {
  // #swagger.tags = ['Contact']
  try {
    const newContact = new contactModel(req.body)
    await newContact.validate()
    await newContact.save()
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const updateProcessContact = async (req: Request, res: Response) => {
  // #swagger.tags = ['Contact']
  try {
    const contactId = req.query.contactId
    const status = req.query.status
    const result = await contactModel.findOneAndUpdate({ _id: contactId }, { processed: status }, { new: true })
    if (!result) {
      throw new Error('Error updating contact')
    }
    res.status(StatusCodes.OK).send({ message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}
