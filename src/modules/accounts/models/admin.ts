import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: true })
export class Admin implements IAdmin {
  @Prop({ type: Types.ObjectId, required: true, ref: 'user' })
  userId!: Types.ObjectId
}

export const adminSchema = SchemaFactory.createForClass(Admin)
