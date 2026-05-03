import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class Client implements IClient {
  @Prop({ type: Types.ObjectId, required: true, ref: 'users' })
  userInfo!: Types.ObjectId

  @Prop({ type: String, default: '' })
  memberId!: string

  @Prop({ type: String, default: '' })
  emergencyContact!: string

  @Prop({ type: String, default: '' })
  emergencyPhone!: string

  @Prop({ type: Boolean, default: false })
  medicalHistory!: boolean

  @Prop({ type: [String], default: [] })
  medicalConditions!: string[]

  @Prop({ type: String, default: '' })
  medicalDetail!: string

  @Prop({ type: String, default: '' })
  avatarUrl!: string

  @Prop({ type: String, default: '' })
  email!: string

  @Prop([{ type: Types.ObjectId, required: true, ref: 'trainer' }])
  trainer!: Types.ObjectId[]

  @Prop({ type: [{ type: Types.ObjectId, required: true, ref: 'users' }] })
  exercise!: Types.ObjectId[]

  organizationId!: Types.ObjectId
}

export const clientSchema = SchemaFactory.createForClass(Client)
