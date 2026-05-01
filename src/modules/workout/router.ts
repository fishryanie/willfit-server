import * as express from 'express'
import { baseRESTful } from 'utils/helpers'
import { createWorkoutSession, getWorkoutSessionByClient } from './controller'
import {
  equipmentModel,
  exerciseCategoriesModel,
  exerciseGoalModel,
  exerciseLevelModel,
  exerciseModel,
  muscleCategoriesModel,
  muscleModel
} from './schema'
import { verifyToken } from 'middleware/auth'

const router = express.Router()
const optionExerciseSelect = {
  populate: [
    { path: 'goal', select: ['-__v'] },
    { path: 'level', select: ['-__v'] },
    { path: 'muscle', select: ['-__v'] },
    { path: 'category', select: ['-__v'] },
    { path: 'equipment', select: ['-__v'] }
  ]
}
const optionMuscleSelect = {
  populate: [{ path: 'category', select: ['-__v'] }]
}
baseRESTful('/equipment', router, equipmentModel)
baseRESTful('/muscles-categories', router, muscleCategoriesModel)
baseRESTful('/exercise-goals', router, exerciseGoalModel)
baseRESTful('/exercise-level', router, exerciseLevelModel)
baseRESTful('/exercise-categories', router, exerciseCategoriesModel)
baseRESTful('/exercise', router, exerciseModel, optionExerciseSelect)
baseRESTful('/muscles', router, muscleModel, optionMuscleSelect)

router.get('/workout-session/client', verifyToken, getWorkoutSessionByClient)
router.post('/workout-session', createWorkoutSession)

export default router
