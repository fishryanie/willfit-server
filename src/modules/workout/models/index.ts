import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema({ _id: false })
export class ExerciseOfWorkoutSession implements IExerciseOfWorkoutSession {
  @Prop({ type: Number })
  sets!: number

  @Prop({ type: Number })
  reps!: number

  @Prop({ type: Types.ObjectId, required: true, ref: 'exercises' })
  exercise!: Types.ObjectId

  equipment!: Types.ObjectId

  @Prop({ type: [{ type: Types.ObjectId, required: true, ref: 'schedules' }] })
  schedule!: Types.ObjectId[]
}

export const ExerciseOfWorkoutSessionSchema = SchemaFactory.createForClass(ExerciseOfWorkoutSession)

@Schema(OPTIONS)
export class WorkoutSession implements IWorkoutSession {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: false, default: '' })
  image!: string

  @Prop({ type: String, required: false })
  imageUrl?: string

  @Prop({ type: String, required: false })
  videoUrl?: string

  @Prop({ type: String, required: false })
  description!: string

  @Prop({ type: String, required: false })
  content?: string

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date

  @Prop({ type: Types.ObjectId, required: true, ref: 'clients' })
  client!: Types.ObjectId

  @Prop({ type: [ExerciseOfWorkoutSessionSchema], required: true })
  exercises!: IExerciseOfWorkoutSession[]
}

export const WorkoutSessionSchema = SchemaFactory.createForClass(WorkoutSession)

@Schema(OPTIONS)
export class Exercise implements IExercise {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: false, default: '' })
  image!: string

  @Prop({ type: String, required: false })
  imageUrl?: string

  @Prop({ type: String, required: false })
  videoUrl?: string

  @Prop({ type: String, required: false })
  description!: string

  @Prop({ type: String, required: false })
  content?: string

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date

  @Prop({ type: Types.ObjectId, required: true, ref: 'exercise_goals' })
  goal!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'exercise_levels' })
  level!: Types.ObjectId

  @Prop([{ type: Types.ObjectId, required: true, ref: 'muscles' }])
  muscle!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'equipments' })
  equipment!: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true, ref: 'exercise_categories' })
  category!: Types.ObjectId
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise)

@Schema(OPTIONS)
export class Muscle implements IDefinitionCommon {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: false, default: '' })
  image!: string

  @Prop({ type: String, required: false })
  imageUrl?: string

  @Prop({ type: String, required: false })
  videoUrl?: string

  @Prop({ type: String, required: false })
  description!: string

  @Prop({ type: String, required: false })
  content?: string

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date

  @Prop({ type: Types.ObjectId, required: true, ref: 'muscle_categories' })
  category!: Types.ObjectId
}

export const MuscleSchema = SchemaFactory.createForClass(Muscle)
