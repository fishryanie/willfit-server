import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: true })
export class Staff implements IStaff {
  @Prop({ type: Types.ObjectId, required: true, ref: 'user' })
  userId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'organization' })
  organizationId!: Types.ObjectId

  @Prop({ type: String, required: false, default: '' })
  memberId!: string
}

export const staffSchema = SchemaFactory.createForClass(Staff)
