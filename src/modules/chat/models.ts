import { OPTIONS } from 'constants/schema'
import { model, Schema } from 'mongoose'

const messageSchema = new Schema<Message>(
  {
    conversationId: { type: Schema.Types.ObjectId, required: true, ref: 'conversations', index: true },
    message: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    seen: { type: Boolean, default: false },
    sent: { type: Boolean, default: true },
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, required: false },
    seenAt: { type: Date, required: false },
    receiver: { type: Schema.Types.ObjectId, required: true, index: true },
    msgByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    clientMessageId: { type: String, required: false }
  },
  OPTIONS
)

const conversationSchema = new Schema<Conversation>(
  {
    sender: { type: Schema.Types.ObjectId, required: true },
    receiver: { type: Schema.Types.ObjectId, required: true },
    participants: [{ type: Schema.Types.ObjectId, required: true, index: true }],
    participantKey: { type: String, required: false },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'messages' },
    lastMessageAt: { type: Date, required: false, index: true }
  },
  OPTIONS
)

messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ receiver: 1, seen: 1, createdAt: -1 })
messageSchema.index({ msgByUserId: 1, clientMessageId: 1 }, { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } })
conversationSchema.index({ participants: 1, lastMessageAt: -1 })
conversationSchema.index({ participantKey: 1 }, { unique: true, partialFilterExpression: { participantKey: { $type: 'string' } } })

export const messageModel = model('messages', messageSchema)
export const conversationModel = model('conversations', conversationSchema)
