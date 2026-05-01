import { OPTIONS } from 'constants/schema'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, required: false, default: '' },
    lastName: { type: String, required: false, default: '' },
    middleName: { type: String, required: false, default: '' },
    fullName: { type: String, required: false, default: '' },
    dateOfBirth: { type: String, required: false, default: '' },
    gender: { type: Number, required: false, default: 0 },
    phone: { type: String, required: true, default: '' },
    securityNumber: { type: String, required: false, default: '' },
    address: { type: String, required: false, default: '' },
    states: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'states' }
  },
  OPTIONS
)

export const userModel = mongoose.model<IUser>('users', userSchema)
