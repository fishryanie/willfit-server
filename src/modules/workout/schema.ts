import { definition, OPTIONS, SCHEMA_COMMON } from 'constants/schema'
import mongoose, { Schema } from 'mongoose'

const ExerciseOfWorkoutSessionSchema = new Schema<IExerciseOfWorkoutSession>(
  {
    sets: { type: Number },
    reps: { type: Number },
    exercise: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'exercises' },
    schedule: { type: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'schedules' }] }
  },
  { _id: false }
)

const WorkoutSessionSchema = new Schema<IWorkoutSession>(
  {
    ...definition,
    client: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'clients' },
    exercises: { type: [ExerciseOfWorkoutSessionSchema], required: true }
  },
  OPTIONS
)

const ExerciseSchema = new Schema<IExercise>(
  {
    ...definition,
    goal: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'exercise_goals' },
    level: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'exercise_levels' },
    muscle: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'muscles' }],
    equipment: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'equipments' },
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'exercise_categories' }
  },
  OPTIONS
)

const MuscleSchema = new Schema<IDefinitionCommon & { category: mongoose.Types.ObjectId }>(
  { ...definition, category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'muscle_categories' } },
  OPTIONS
)

export const exerciseModel = mongoose.model<IExercise>('exercises', ExerciseSchema)
export const equipmentModel = mongoose.model<IDefinitionCommon>('equipments', SCHEMA_COMMON)
export const exerciseGoalModel = mongoose.model<IDefinitionCommon>('exercise_goals', SCHEMA_COMMON)
export const exerciseLevelModel = mongoose.model<IDefinitionCommon>('exercise_levels', SCHEMA_COMMON)
export const muscleCategoriesModel = mongoose.model<IDefinitionCommon>('muscle_categories', SCHEMA_COMMON)
export const exerciseCategoriesModel = mongoose.model<IDefinitionCommon>('exercise_categories', SCHEMA_COMMON)
export const workoutSessionModel = mongoose.model<IWorkoutSession>('workout_sessions', WorkoutSessionSchema)
export const muscleModel = mongoose.model<IDefinitionCommon & { category: mongoose.Types.ObjectId }>(
  'muscles',
  MuscleSchema
)
