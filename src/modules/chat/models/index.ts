import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class MessageHistory implements Message {
  @Prop({ type: Types.ObjectId, required: true, ref: 'conversations', index: true })
  conversationId!: Types.ObjectId

  @Prop({ type: String, default: '' })
  message!: string

  @Prop({ type: String, default: '' })
  imageUrl?: string

  @Prop({ type: String, default: '' })
  videoUrl?: string

  @Prop({ type: Boolean, default: false })
  seen!: boolean

  @Prop({ type: Boolean, default: true })
  sent!: boolean

  @Prop({ type: Boolean, default: false })
  delivered!: boolean

  @Prop({ type: Date, required: false })
  deliveredAt?: Date

  @Prop({ type: Date, required: false })
  seenAt?: Date

  @Prop({ type: Types.ObjectId, required: true, index: true })
  receiver!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, index: true })
  msgByUserId!: Types.ObjectId

  @Prop({ type: String, required: false })
  clientMessageId?: string

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date
}

export const messageSchema = SchemaFactory.createForClass(MessageHistory)
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ receiver: 1, seen: 1, createdAt: -1 })
messageSchema.index({ msgByUserId: 1, clientMessageId: 1 }, { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } })

@Schema(OPTIONS)
export class ConversationHistory implements Conversation {
  @Prop({ type: Types.ObjectId, required: true })
  sender!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true })
  receiver!: Types.ObjectId

  @Prop([{ type: Types.ObjectId, required: true, index: true }])
  participants!: Types.ObjectId[]

  @Prop({ type: String, required: false })
  participantKey!: string

  @Prop({ type: Types.ObjectId, ref: 'messages' })
  lastMessage!: Types.ObjectId

  @Prop({ type: Date, required: false, index: true })
  lastMessageAt?: Date

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date
}

export const conversationSchema = SchemaFactory.createForClass(ConversationHistory)
conversationSchema.index({ participants: 1, lastMessageAt: -1 })
conversationSchema.index({ participantKey: 1 }, { unique: true, partialFilterExpression: { participantKey: { $type: 'string' } } })
