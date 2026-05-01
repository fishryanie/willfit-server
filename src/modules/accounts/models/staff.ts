import mongoose, { Schema } from 'mongoose'

const staffSchema = new Schema<IStaff>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'organization' },
    memberId: { type: String, required: false, default: '' }
  },
  { timestamps: true }
)

export const staffModel = mongoose.model('data_staff', staffSchema)
