import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import mongoose, { Types } from 'mongoose'
import type { Model } from 'mongoose'
import { ChatGateway } from 'modules/chat/chat.gateway'
import { PresenceService } from 'modules/chat/presence.service'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { PushQueueService } from 'modules/notifications/queue/push.queue'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'

const MAX_MESSAGE_LENGTH = 5_000

const getParticipantKey = (userA: string, userB: string) => [userA, userB].sort().join(':')

@Injectable()
export class ChatService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @Inject(PushQueueService) private readonly pushQueueService: PushQueueService,
    @Inject(ChatGateway) private readonly chatGateway: ChatGateway,
    @Inject(PresenceService) private readonly presenceService: PresenceService,
    @InjectModel(MODEL_NAMES.conversation) private readonly conversationModel: Model<any>,
    @InjectModel(MODEL_NAMES.message) private readonly messageModel: Model<any>,
    @InjectModel(MODEL_NAMES.accountToken) private readonly accountTokenModel: Model<IAccountToken>,
    @InjectModel(MODEL_NAMES.pushDevice) private readonly pushDeviceModel: Model<IPushDevice>
  ) {}

  async listConversations(userId: string, query: CrudListQuery) {
    const { limit, page, skip } = this.crud.parsePagination(query)
    const filter = {
      $and: [
        { $or: [{ participants: userId }, { sender: userId }, { receiver: userId }] },
        query.onlyDeleted === 'true' ? { deletedAt: { $ne: null } } : { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }
      ]
    }
    const [total, conversations, unreadCounts] = await Promise.all([
      this.conversationModel.countDocuments(filter).exec(),
      this.conversationModel
        .find(filter)
        .populate('sender')
        .populate('receiver')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean()
        .exec(),
      this.messageModel
        .aggregate<{
          _id: Types.ObjectId
          count: number
        }>([{ $match: { receiver: new Types.ObjectId(userId), seen: false, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] } }, { $group: { _id: '$conversationId', count: { $sum: 1 } } }])
        .exec()
    ])
    const unreadByConversationId = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]))
    const list = conversations.map((conversation) => ({ ...conversation, unseenMsg: unreadByConversationId.get(conversation._id.toString()) || 0 }))
    return { list, limit, total, page, totalPages: Math.ceil(total / limit), message: 'OK' }
  }

  async listMessages(userId: string, query: CrudListQuery) {
    const receiverId = typeof query.receiverId === 'string' ? query.receiverId : undefined
    const conversationId = typeof query.conversationId === 'string' ? query.conversationId : undefined
    const { limit, page, skip } = this.crud.parsePagination(query)
    let conversation = conversationId ? await this.findConversationForUser(conversationId, userId) : null

    if (!conversation && receiverId) {
      if (!mongoose.Types.ObjectId.isValid(receiverId)) throw new BadRequestException('Invalid receiverId')
      conversation = await this.findConversationBetween(userId, receiverId)
    }

    if (!conversation) return { list: [], limit, total: 0, page, totalPages: 0, message: 'OK' }

    const filter = {
      conversationId: conversation._id,
      ...(query.onlyDeleted === 'true' ? { deletedAt: { $ne: null } } : { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] })
    }
    const [total, list] = await Promise.all([
      this.messageModel.countDocuments(filter).exec(),
      this.messageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v').lean().exec()
    ])

    await this.messageModel
      .updateMany({ conversationId: conversation._id, receiver: userId, delivered: false }, { $set: { delivered: true, deliveredAt: new Date() } })
      .exec()

    return { list: list.reverse(), conversation, limit, total, page, totalPages: Math.ceil(total / limit), message: 'OK' }
  }

  async sendMessage(userId: string, payload: Record<string, unknown>) {
    const receiverId = typeof payload.receiverId === 'string' ? payload.receiverId : ''
    const clientMessageId = typeof payload.clientMessageId === 'string' ? payload.clientMessageId.trim() : undefined
    const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
    const imageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() : ''
    const videoUrl = typeof payload.videoUrl === 'string' ? payload.videoUrl.trim() : ''

    if (!mongoose.Types.ObjectId.isValid(receiverId)) throw new BadRequestException('Invalid receiverId')
    if (receiverId === userId) throw new BadRequestException('Cannot send message to yourself')
    if (!message && !imageUrl && !videoUrl) throw new BadRequestException('Message, imageUrl or videoUrl is required')

    if (clientMessageId) {
      const existingMessage = await this.messageModel.findOne({ msgByUserId: userId, clientMessageId }).lean().exec()
      if (existingMessage) return { record: existingMessage, message: 'OK' }
    }

    const conversation = await this.ensureConversationBetween(userId, receiverId)
    const receiverOnline = this.presenceService.isOnline(receiverId)
    const savedMessage = await this.messageModel.create({
      conversationId: conversation._id,
      message,
      imageUrl,
      videoUrl,
      receiver: receiverId,
      msgByUserId: userId,
      clientMessageId,
      delivered: receiverOnline,
      deliveredAt: receiverOnline ? new Date() : undefined,
      deletedAt: null
    })

    await this.conversationModel
      .findByIdAndUpdate(conversation._id, { $set: { lastMessage: savedMessage._id, lastMessageAt: (savedMessage as any).createdAt, deletedAt: null } })
      .exec()

    this.chatGateway.emitToUser(receiverId, 'newMessages', savedMessage)
    this.chatGateway.emitToUser(userId, 'messageSent', savedMessage)
    if (!receiverOnline) void this.sendOfflinePush(userId, receiverId, conversation._id.toString(), message, imageUrl, videoUrl)
    return { record: savedMessage, message: 'Created' }
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.findConversationForUser(conversationId, userId)
    if (!conversation) throw new NotFoundException('Conversation not found')
    const now = new Date()
    const result = await this.messageModel
      .updateMany({ seen: false, conversationId: conversation._id, receiver: userId }, { $set: { seen: true, seenAt: now, delivered: true, deliveredAt: now } })
      .exec()
    const senderId = conversation.sender.toString() === userId ? conversation.receiver.toString() : conversation.sender.toString()
    this.chatGateway.emitToUser(senderId, 'messagesSeen', { conversationId, readerId: userId, seenAt: now.toISOString() })
    return { message: 'OK', modifiedCount: result.modifiedCount }
  }

  deleteMessage(id: string) {
    return this.crud.softDelete(this.messageModel, id)
  }

  restoreMessage(id: string) {
    return this.crud.restore(this.messageModel, id)
  }

  deleteConversation(id: string) {
    return this.crud.softDelete(this.conversationModel, id)
  }

  restoreConversation(id: string) {
    return this.crud.restore(this.conversationModel, id)
  }

  private async findConversationBetween(userA: string, userB: string) {
    return this.conversationModel
      .findOne({
        $or: [{ participantKey: getParticipantKey(userA, userB) }, { sender: userA, receiver: userB }, { sender: userB, receiver: userA }]
      })
      .select('-__v')
      .exec()
  }

  private async ensureConversationBetween(senderId: string, receiverId: string) {
    const existing = await this.findConversationBetween(senderId, receiverId)
    if (existing) return existing
    const participants = [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)]
    return this.conversationModel
      .findOneAndUpdate(
        { participantKey: getParticipantKey(senderId, receiverId) },
        { $setOnInsert: { sender: senderId, receiver: receiverId, participants, participantKey: getParticipantKey(senderId, receiverId), deletedAt: null } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      .select('-__v')
      .exec()
  }

  private async findConversationForUser(conversationId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) throw new BadRequestException('Invalid conversationId')
    return this.conversationModel.findOne({ _id: conversationId, $or: [{ participants: userId }, { sender: userId }, { receiver: userId }] }).exec()
  }

  private async sendOfflinePush(senderId: string, receiverId: string, conversationId: string, message: string, imageUrl?: string, videoUrl?: string) {
    const [senderAccount, deviceTokens] = await Promise.all([
      this.accountTokenModel.findOne({ accountId: senderId }).select('name').lean().exec(),
      this.pushDeviceModel.distinct('token', { accountId: receiverId, active: true, notificationEnabled: { $ne: false } })
    ])
    if (deviceTokens.length === 0) return
    this.pushQueueService.enqueuePushToTokens({
      tokens: deviceTokens,
      notification: {
        title: senderAccount?.name || 'WillFit',
        body: message || (imageUrl ? 'Bạn vừa nhận một hình ảnh mới' : videoUrl ? 'Bạn vừa nhận một video mới' : 'Bạn có tin nhắn mới')
      },
      data: { type: 'chat', conversationId, senderId, receiverId }
    })
  }
}
