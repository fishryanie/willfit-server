import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: true })
export class AccountToken implements IAccountToken {
  @Prop({ type: Types.ObjectId, required: true })
  accountId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'account_role' })
  role!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'account_status' })
  status!: Types.ObjectId

  @Prop({ type: String, required: false })
  fcmToken!: string

  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: true })
  username!: string

  @Prop({ type: String, required: true })
  password!: string
}

export const accountTokenSchema = SchemaFactory.createForClass(AccountToken)
