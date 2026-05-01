import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { workoutValidationSchema } from './validations'
import { workoutSessionModel } from './schema'
import { clientModel } from 'models'
import { RoleAccount } from 'enums/common'

export const createWorkoutSession = async (req: Request, res: Response) => {
  try {
    const { error, value } = workoutValidationSchema.validate(req.body)
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.details[0].message })
      return
    }
    const workout = new workoutSessionModel(value)
    await workout.save()
    res.send(workout)
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const getWorkoutSessionByClient = async (req: TokenVerifiedRequest, res: Response) => {
  try {
    const CLIENT = await clientModel.findById(req.tokenVerified?.userId).exec()
    if (!CLIENT) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.NOT_FOUND,
        message: `Not found client with id ${req.tokenVerified?.userId}`
      })
      return
    }
    const limit = Number(req.query.limit) || 20
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    delete req.query.page
    delete req.query.limit
    const [total, list] = await Promise.all([
      workoutSessionModel.countDocuments().exec(),
      workoutSessionModel
        .find({ client: CLIENT._id })
        .populate({
          path: 'exercises.exercise',
          select: '-content',
          model: 'exercises',
          populate: [
            { path: 'muscle', model: 'muscles' },
            { path: 'equipment', model: 'equipments' },
            { path: 'goal', model: 'exercise_goals' },
            { path: 'level', model: 'exercise_levels' }
          ]
        })
        .populate({ path: 'exercises.schedule', model: 'schedules' })
        .select('-client -__v')
        .skip(skip)
        .limit(limit)
        .exec()
    ])
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}
