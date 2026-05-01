import type { Response } from 'express'
import mongoose, { Types } from 'mongoose'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { accountTokenModel, pushDeviceModel } from 'models'
import { enqueuePushToTokens } from 'modules/notifications/queue/pushQueue'
import { isUserOnline, userRoom } from 'modules/chat/presenceService'
import { io } from 'utils/server'
import { conversationModel, messageModel } from './models'

const MAX_MESSAGE_LIMIT = 100
const MAX_MESSAGE_LENGTH = 5_000

const toObjectId = (value: unknown) => {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    return undefined
  }
  return new Types.ObjectId(value)
}

const parsePagination = (query: TokenVerifiedRequest['query'], defaultLimit = 20) => {
  const rawLimit = Number(query.limit)
  const rawPage = Number(query.page)
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit, MAX_MESSAGE_LIMIT)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  return { limit, page, skip: (page - 1) * limit }
}

const getCurrentUserId = (req: TokenVerifiedRequest) => {
  return req.tokenVerified?.userId?.toString()
}

const getParticipantKey = (userA: string, userB: string) => {
  return [userA, userB].sort().join(':')
}

const normalizeConversation = async (conversation: Conversation & { _id: Types.ObjectId }, userA: string, userB: string) => {
  const participantKey = getParticipantKey(userA, userB)
  if (conversation.participantKey === participantKey) {
    return conversation
  }

  const participants = [new Types.ObjectId(userA), new Types.ObjectId(userB)]
  await conversationModel.updateOne({ _id: conversation._id }, { $set: { participants, participantKey } }).exec()
  conversation.participants = participants as unknown as Conversation['participants']
  conversation.participantKey = participantKey
  return conversation
}

const findConversationBetween = async (userA: string, userB: string) => {
  const participantKey = getParticipantKey(userA, userB)
  const conversation = await conversationModel
    .findOne({
      $or: [
        { participantKey },
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA }
      ]
    })
    .select('-__v')
    .exec()

  return conversation ? normalizeConversation(conversation as Conversation & { _id: Types.ObjectId }, userA, userB) : null
}

const ensureConversationBetween = async (senderId: string, receiverId: string) => {
  const existingConversation = await findConversationBetween(senderId, receiverId)
  if (existingConversation) {
    return existingConversation
  }

  const participantKey = getParticipantKey(senderId, receiverId)
  const participants = [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)]
  return conversationModel
    .findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          sender: senderId,
          receiver: receiverId,
          participants,
          participantKey
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    .select('-__v')
    .exec()
}

const sendOfflineChatPush = async (payload: {
  senderId: string
  receiverId: string
  conversationId: string
  message: string
  imageUrl?: string
  videoUrl?: string
}) => {
  const [senderAccount, deviceTokens, fallbackAccountToken] = await Promise.all([
    accountTokenModel.findOne({ accountId: payload.senderId }).select('name').lean().exec(),
    pushDeviceModel.distinct('token', {
      accountId: payload.receiverId,
      active: true,
      notificationEnabled: { $ne: false }
    }),
    accountTokenModel.findOne({ accountId: payload.receiverId }).select('fcmToken').lean().exec()
  ])
  const tokens = new Set<string>(deviceTokens)
  if (fallbackAccountToken?.fcmToken) {
    tokens.add(fallbackAccountToken.fcmToken)
  }

  if (tokens.size === 0) {
    return
  }

  const notificationBody =
    payload.message ||
    (payload.imageUrl ? 'Bạn vừa nhận một hình ảnh mới' : payload.videoUrl ? 'Bạn vừa nhận một video mới' : 'Bạn có tin nhắn mới')

  enqueuePushToTokens({
    tokens: Array.from(tokens),
    notification: { title: senderAccount?.name || 'WillFit', body: notificationBody },
    data: {
      type: 'chat',
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      receiverId: payload.receiverId
    }
  })
}

export const getMessage = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Chat']
  try {
    const currentUserId = getCurrentUserId(req)
    const receiverId = typeof req.query.receiverId === 'string' ? req.query.receiverId : undefined
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined
    const { limit, page, skip } = parsePagination(req.query)

    if (!currentUserId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }

    let conversation = ((
      conversationId && mongoose.Types.ObjectId.isValid(conversationId)
        ? await conversationModel
            .findOne({ _id: conversationId, $or: [{ participants: currentUserId }, { sender: currentUserId }, { receiver: currentUserId }] })
            .exec()
        : null
    ) as (Conversation & { _id: Types.ObjectId }) | null)

    if (!conversation && receiverId) {
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid receiverId' })
        return
      }
      conversation = await findConversationBetween(currentUserId, receiverId)
    }

    if (!conversation) {
      res.status(StatusCodes.OK).send({ list: [], limit, total: 0, page, totalPages: 0, message: ReasonPhrases.OK })
      return
    }

    const conversationObjectId = conversation._id as Types.ObjectId
    const filter = { conversationId: conversationObjectId }

    const [total, list] = await Promise.all([
      messageModel.countDocuments(filter).exec(),
      messageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v').lean().exec()
    ])

    await messageModel
      .updateMany(
        { conversationId: conversationObjectId, receiver: currentUserId, delivered: false },
        { $set: { delivered: true, deliveredAt: new Date() } }
      )
      .exec()

    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({
      list: list.reverse(),
      conversation,
      limit,
      total,
      page,
      totalPages,
      message: ReasonPhrases.OK
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const getChatHistory = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Chat']
  try {
    const currentUserId = getCurrentUserId(req)
    const { limit, page, skip } = parsePagination(req.query)
    if (!currentUserId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }

    const filter = { $or: [{ participants: currentUserId }, { sender: currentUserId }, { receiver: currentUserId }] }
    const [total, conversations, unreadCounts] = await Promise.all([
      conversationModel.countDocuments(filter).exec(),
      conversationModel
        .find(filter)
        .populate('sender')
        .populate('receiver')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-messages -__v')
        .lean()
        .exec(),
      messageModel
        .aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { receiver: new Types.ObjectId(currentUserId), seen: false } },
          { $group: { _id: '$conversationId', count: { $sum: 1 } } }
        ])
        .exec()
    ])

    const unreadByConversationId = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]))
    const list = conversations.map((conversation) => ({
      ...conversation,
      unseenMsg: unreadByConversationId.get(conversation._id.toString()) || 0
    }))

    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, page, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const sendMessage = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Chat']
  try {
    const senderId = getCurrentUserId(req)
    const receiverId = typeof req.body.receiverId === 'string' ? req.body.receiverId : ''
    const clientMessageId = typeof req.body.clientMessageId === 'string' ? req.body.clientMessageId.trim() : undefined
    const message = typeof req.body.message === 'string' ? req.body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
    const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : ''
    const videoUrl = typeof req.body.videoUrl === 'string' ? req.body.videoUrl.trim() : ''

    if (!senderId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }

    if (!toObjectId(receiverId)) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid receiverId' })
      return
    }

    if (!message && !imageUrl && !videoUrl) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Message, imageUrl or videoUrl is required' })
      return
    }

    if (senderId === receiverId) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Cannot send message to yourself' })
      return
    }

    if (clientMessageId) {
      const existingMessage = await messageModel.findOne({ msgByUserId: senderId, clientMessageId }).lean().exec()
      if (existingMessage) {
        res.status(StatusCodes.OK).send({ record: existingMessage, code: StatusCodes.OK, message: ReasonPhrases.OK })
        return
      }
    }

    const conversation = await ensureConversationBetween(senderId, receiverId)
    const receiverOnline = isUserOnline(receiverId)
    const savedMessage = await messageModel.create({
      conversationId: conversation._id,
      message,
      imageUrl,
      videoUrl,
      receiver: receiverId,
      msgByUserId: senderId,
      clientMessageId,
      delivered: receiverOnline,
      deliveredAt: receiverOnline ? new Date() : undefined
    })

    await conversationModel
      .findByIdAndUpdate(conversation._id, {
        $set: {
          lastMessage: savedMessage._id,
          lastMessageAt: (savedMessage as typeof savedMessage & { createdAt: Date }).createdAt
        }
      })
      .exec()

    io.to(userRoom(receiverId)).emit('newMessages', savedMessage)
    io.to(userRoom(senderId)).emit('messageSent', savedMessage)

    if (!receiverOnline) {
      void sendOfflineChatPush({
        senderId,
        receiverId,
        conversationId: (conversation._id as Types.ObjectId).toString(),
        message,
        imageUrl,
        videoUrl
      }).catch((error) => console.error('Failed to send offline chat push', error))
    }

    res.status(StatusCodes.CREATED).send({ record: savedMessage, code: StatusCodes.CREATED, message: ReasonPhrases.CREATED })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const markMessagesRead = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Chat']
  try {
    const currentUserId = getCurrentUserId(req)
    const conversationId = req.params.conversationId
    if (!currentUserId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid conversationId' })
      return
    }

    const conversation = await conversationModel
      .findOne({ _id: conversationId, $or: [{ participants: currentUserId }, { sender: currentUserId }, { receiver: currentUserId }] })
      .select('sender receiver')
      .exec()
    if (!conversation) {
      res.status(StatusCodes.NOT_FOUND).send({ message: 'Conversation not found' })
      return
    }

    const now = new Date()
    const result = await messageModel
      .updateMany(
        {
          seen: false,
          conversationId: conversation._id,
          receiver: currentUserId
        },
        { $set: { seen: true, seenAt: now, delivered: true, deliveredAt: now } }
      )
      .exec()

    const conversationSenderId = conversation.sender.toString()
    const conversationReceiverId = conversation.receiver.toString()
    const senderId = conversationSenderId === currentUserId ? conversationReceiverId : conversationSenderId
    io.to(userRoom(senderId)).emit('messagesSeen', {
      conversationId,
      readerId: currentUserId,
      seenAt: now.toISOString()
    })

    res.status(StatusCodes.OK).send({ message: ReasonPhrases.OK, modifiedCount: result.modifiedCount })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}
