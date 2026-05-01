import Joi from 'joi'
import mongoose from 'mongoose'

interface IWorkoutSessionRequest extends IWorkoutSession {
  client: mongoose.Types.ObjectId
}

export const exerciseSchema = Joi.object<IExerciseOfWorkoutSession>({
  exercise: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message({ en: 'Invalid exercise ID' })
      }
      return value
    }),
  sets: Joi.number().optional(),
  reps: Joi.number().optional(),
  schedule: Joi.array().items(
    Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message({ en: 'Invalid schedule ID' })
        }
        return value
      })
  )
})

export const workoutValidationSchema = Joi.object<IWorkoutSessionRequest>({
  client: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message({ en: 'Invalid equipment ID' })
      }
      return value
    }),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  exercises: Joi.array().items(exerciseSchema).required()
})
