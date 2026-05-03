import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { ContactType, EnumTypePlan, TypeNotify } from 'enums/common'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class NotificationHistory {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: false })
  imageUrl?: string

  @Prop({ type: String, required: false })
  videoUrl?: string

  @Prop({ type: String, required: false })
  description?: string

  @Prop({ type: String, required: false })
  content?: string

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date

  @Prop({ type: String, enum: TypeNotify, default: TypeNotify.All })
  type!: TypeNotify

  @Prop([{ type: Types.ObjectId, ref: 'user' }])
  read!: Types.ObjectId[]

  @Prop([{ type: Types.ObjectId, ref: 'user' }])
  deleteBy!: Types.ObjectId[]

  @Prop([{ type: Types.ObjectId, required: false, ref: 'user' }])
  privateWith!: Types.ObjectId[]
}

export const notifyHistorySchema = SchemaFactory.createForClass(NotificationHistory)
notifyHistorySchema.index({ type: 1, createdAt: -1 })
notifyHistorySchema.index({ privateWith: 1, createdAt: -1 })

@Schema({ _id: false })
export class MealItem {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: Number, required: false, default: 0 })
  calories?: number

  @Prop({ type: Number, required: false, default: 0 })
  protein?: number

  @Prop({ type: Number, required: false, default: 0 })
  carbs?: number

  @Prop({ type: Number, required: false, default: 0 })
  fat?: number

  @Prop({ type: String, required: false })
  serving?: string

  @Prop({ type: String, required: false })
  mealTime?: string
}

export const MealItemSchema = SchemaFactory.createForClass(MealItem)

@Schema(OPTIONS)
export class Plan {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: false })
  content?: string

  @Prop({ type: String, required: false })
  imageUrl?: string

  @Prop({ type: String, required: false })
  bannerUrl?: string

  @Prop({ type: String, required: false })
  description?: string

  @Prop({ type: String, required: true })
  duration!: string

  @Prop({ type: Types.ObjectId, required: true, ref: 'exercise_levels' })
  level!: Types.ObjectId

  @Prop({ type: [{ type: Types.ObjectId, required: true, ref: 'schedules' }] })
  schedule!: Types.ObjectId[]

  @Prop({ type: String, enum: EnumTypePlan, default: EnumTypePlan.WORKOUT })
  type!: EnumTypePlan

  @Prop({ type: [MealItemSchema], default: [] })
  mealItems!: MealItem[]

  @Prop({ type: Number, required: false })
  targetCalories?: number

  @Prop({ type: Date, required: false, default: null, index: true })
  deletedAt?: Date
}

export const planSchema = SchemaFactory.createForClass(Plan)

@Schema(OPTIONS)
export class Article implements IDefinitionCommon {
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

  @Prop({ type: Types.ObjectId, required: true, ref: 'article_categories' })
  category!: Types.ObjectId
}

export const ArticleSchema = SchemaFactory.createForClass(Article)

@Schema(OPTIONS)
export class Contact implements IContact {
  id!: string

  @Prop({ type: String, required: [true, 'Please provide a sender name for this contact.'] })
  name!: string

  @Prop({ type: String, required: [true, 'Please provide a sender email for this contact.'] })
  email!: string

  @Prop({ type: String, required: [true, 'Please provide a sender phone for this contact.'] })
  phone!: string

  @Prop({ type: String, required: [true, 'Please provide a sender company for this contact.'] })
  company!: string

  @Prop({ type: Boolean, default: false })
  processed?: boolean

  @Prop({
    type: String,
    required: [true, 'Please provide a message for this contact.'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  })
  message!: string

  @Prop({
    type: String,
    enum: ContactType,
    required: [true, 'Please provide a type for this contact.']
  })
  type!: ContactType
}

export const ContactSchema = SchemaFactory.createForClass(Contact)
