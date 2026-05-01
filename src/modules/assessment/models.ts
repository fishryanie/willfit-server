import mongoose from 'mongoose'

export const assessmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    duration: { type: String, required: true },
    level: { type: String, required: true },
    description: { type: String, required: true }
  },
  { timestamps: true }
)

export const assessmentModel = mongoose.model('assessment', assessmentSchema)
