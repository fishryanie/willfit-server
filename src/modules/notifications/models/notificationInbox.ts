import { OPTIONS } from 'constants/schema'
import mongoose, { Schema } from 'mongoose'

const notificationInboxSchema = new Schema<INotificationInbox>(
  {
    notification: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'notifications', index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    readAt: { type: Date, required: false },
    deletedAt: { type: Date, required: false },
    deliveredAt: { type: Date, required: false }
  },
  OPTIONS
)

notificationInboxSchema.index({ accountId: 1, deletedAt: 1, createdAt: -1 })
notificationInboxSchema.index({ notification: 1, accountId: 1 }, { unique: true })

export const notificationInboxModel = mongoose.model<INotificationInbox>('notification_inbox', notificationInboxSchema)
