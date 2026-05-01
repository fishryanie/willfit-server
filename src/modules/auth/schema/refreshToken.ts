import mongoose, { Schema } from 'mongoose'

export const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    accountTokenId: { type: mongoose.Schema.Types.ObjectId, required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true, autoIndex: true, expires: 1, expireAfterSeconds: 0 }
)
