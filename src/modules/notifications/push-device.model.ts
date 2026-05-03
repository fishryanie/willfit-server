import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class PushDevice implements IPushDevice {
  @Prop({ type: String, required: true, unique: true, index: true })
  token!: string

  @Prop({ type: Types.ObjectId, required: false, index: true })
  accountId?: Types.ObjectId

  @Prop({ type: String, required: false })
  deviceName?: string

  @Prop({ type: String, required: false })
  platform?: string

  @Prop({ type: String, required: false })
  appVersion?: string

  @Prop({ type: Boolean, default: true })
  active!: boolean

  @Prop({ type: Boolean, default: true })
  notificationEnabled!: boolean

  @Prop({ type: Date, default: Date.now })
  lastSeenAt!: Date

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date
}

export const pushDeviceSchema = SchemaFactory.createForClass(PushDevice)
pushDeviceSchema.index({ accountId: 1, active: 1 })
