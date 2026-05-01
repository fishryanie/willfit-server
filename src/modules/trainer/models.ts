import mongoose, { Schema } from 'mongoose'
// Kay_Halvorson55@yahoo.com
// 9ZMBW8SAu57AnPW
const trainerSchema = new Schema<ITrainer>(
  {
    userInfo: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' },
    branch: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'organization_branches' },
    memberId: { type: String, required: false, default: '' },
    departmentCode: { type: String, required: false, default: '' },
    certificates: { type: [String], required: false, default: [] },
    specialization: { type: String, required: false, default: '' },
    maxClient: { type: Number, required: false, default: 20 }
  },
  { timestamps: true }
)

export const trainerModel = mongoose.model('trainer', trainerSchema)
