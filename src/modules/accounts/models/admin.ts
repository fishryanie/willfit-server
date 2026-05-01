import mongoose, { Schema } from 'mongoose'

const adminSchema = new Schema<IAdmin>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' }
  },
  { timestamps: true }
)

export const adminModel = mongoose.model('data_admin', adminSchema)
