import mongoose, { Schema } from 'mongoose'

export const accountTokenSchema = new Schema<IAccountToken>(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'account_role' },
    status: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'account_status' },
    fcmToken: { type: String, required: false },
    name: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
)

