import { OPTIONS } from 'constants/schema'
import mongoose, { Schema } from 'mongoose'

const pushDeviceSchema = new Schema<IPushDevice>(
  {
    token: { type: String, required: true, unique: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
    deviceName: { type: String, required: false },
    platform: { type: String, required: false },
    appVersion: { type: String, required: false },
    active: { type: Boolean, default: true },
    notificationEnabled: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now }
  },
  OPTIONS
)

pushDeviceSchema.index({ accountId: 1, active: 1 })

export const pushDeviceModel = mongoose.model<IPushDevice>('push_device', pushDeviceSchema)
