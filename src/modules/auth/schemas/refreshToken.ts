import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: true, autoIndex: true, expires: 1, expireAfterSeconds: 0 })
export class RefreshToken implements IRefreshToken {
  @Prop({ type: Types.ObjectId, required: true })
  accountTokenId!: Types.ObjectId

  @Prop({ type: String, required: true, unique: true, index: true })
  token!: string

  @Prop({ type: Date, required: true })
  expiresAt!: Date
}

export const refreshTokenSchema = SchemaFactory.createForClass(RefreshToken)
