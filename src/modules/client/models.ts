import { model, Schema } from 'mongoose'
import { OPTIONS } from 'constants/schema'

const clientSchema = new Schema<IClient>(
  {
    userInfo: { type: Schema.Types.ObjectId, required: true, ref: 'users' },
    memberId: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    emergencyPhone: { type: String, default: '' },
    medicalHistory: { type: Boolean, default: false },
    medicalConditions: { type: [String], default: [] },
    medicalDetail: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    email: { type: String, default: '' },
    trainer: [{ type: Schema.Types.ObjectId, required: true, ref: 'trainer' }],
    exercise: { type: [{ type: Schema.Types.ObjectId, required: true, ref: 'users' }] }
  },
  OPTIONS
)

export const clientModel = model('client', clientSchema)
