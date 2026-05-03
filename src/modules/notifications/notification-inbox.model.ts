import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class NotificationInbox implements INotificationInbox {
  @Prop({ type: Types.ObjectId, required: true, ref: 'notifications', index: true })
  notification!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, index: true })
  accountId!: Types.ObjectId

  @Prop({ type: Date, required: false })
  readAt?: Date

  @Prop({ type: Date, required: false })
  deletedAt?: Date

  @Prop({ type: Date, required: false })
  deliveredAt?: Date
}

export const notificationInboxSchema = SchemaFactory.createForClass(NotificationInbox)
notificationInboxSchema.index({ accountId: 1, deletedAt: 1, createdAt: -1 })
notificationInboxSchema.index({ notification: 1, accountId: 1 }, { unique: true })
