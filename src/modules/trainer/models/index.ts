import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: true })
export class Trainer implements ITrainer {
  @Prop({ type: Types.ObjectId, required: true, ref: 'users' })
  userInfo!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'organization_branches' })
  branch!: Types.ObjectId

  @Prop({ type: String, required: false, default: '' })
  memberId!: string

  @Prop({ type: String, required: false, default: '' })
  departmentCode!: string

  @Prop({ type: [String], required: false, default: [] })
  certificates!: string[]

  @Prop({ type: String, required: false, default: '' })
  specialization!: string

  @Prop({ type: Number, required: false, default: 20 })
  maxClient!: number

  email!: string
  status!: Types.ObjectId
}

export const trainerSchema = SchemaFactory.createForClass(Trainer)
