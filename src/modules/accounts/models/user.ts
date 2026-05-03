import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class User implements IUser {
  @Prop({ type: String, required: false, default: '' })
  firstName!: string

  @Prop({ type: String, required: false, default: '' })
  lastName!: string

  @Prop({ type: String, required: false, default: '' })
  middleName!: string

  @Prop({ type: String, required: false, default: '' })
  fullName!: string

  @Prop({ type: String, required: false, default: '' })
  dateOfBirth!: string

  @Prop({ type: Number, required: false, default: 0 })
  gender!: number

  @Prop({ type: String, required: true, default: '' })
  phone!: string

  @Prop({ type: String, required: false, default: '' })
  securityNumber!: string

  @Prop({ type: String, required: false, default: '' })
  address!: string

  @Prop({ type: Types.ObjectId, required: false, ref: 'states' })
  states!: Types.ObjectId

  notifications!: string[]
}

export const userSchema = SchemaFactory.createForClass(User)
