import { definition, OPTIONS, SCHEMA_COMMON } from 'constants/schema'
import { ContactType, EnumTypePlan, TypeNotify } from 'enums/common'
import { model, Schema } from 'mongoose'

export const notifyHistorySchema = new Schema(
  {
    ...definition,
    type: { type: String, enum: TypeNotify, default: TypeNotify.All },
    read: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    deleteBy: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    privateWith: [{ type: Schema.Types.ObjectId, required: false, ref: 'user' }]
  },
  OPTIONS
)

notifyHistorySchema.index({ type: 1, createdAt: -1 })
notifyHistorySchema.index({ privateWith: 1, createdAt: -1 })

export const planSchema = new Schema(
  {
    name: { type: String, required: true },
    content: { type: String, required: false },
    imageUrl: { type: String, required: false },
    bannerUrl: { type: String, required: false },
    description: { type: String, required: false },
    duration: { type: String, required: true },
    level: { type: Schema.Types.ObjectId, required: true, ref: 'exercise_levels' },
    schedule: { type: [{ type: Schema.Types.ObjectId, required: true, ref: 'schedules' }] },
    type: { type: String, enum: EnumTypePlan, default: EnumTypePlan.WORKOUT }
  },
  OPTIONS
)

export const ArticleSchema = new Schema<IDefinitionCommon & { category: Schema.Types.ObjectId }>(
  { ...definition, category: { type: Schema.Types.ObjectId, required: true, ref: 'article_categories' } },
  OPTIONS
)

const ContactSchema: Schema = new Schema<IContact>(
  {
    name: { type: String, required: [true, 'Please provide a sender name for this contact.'] },
    email: { type: String, required: [true, 'Please provide a sender email for this contact.'] },
    phone: { type: String, required: [true, 'Please provide a sender phone for this contact.'] },
    company: { type: String, required: [true, 'Please provide a sender company for this contact.'] },
    processed: { type: Boolean, default: false },
    message: {
      type: String,
      required: [true, 'Please provide a message for this contact.'],
      maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    type: {
      type: String,
      enum: ContactType,
      required: [true, 'Please provide a type for this contact.']
    }
  },
  OPTIONS
)

export const notifyModel = model('notifications', notifyHistorySchema)
export const articleModel = model<IDefinitionCommon & { category: Schema.Types.ObjectId }>('article', ArticleSchema)
export const articleCategoriesModel = model<IDefinitionCommon>('article_categories', SCHEMA_COMMON)
export const planModel = model<IDefinitionCommon>('plan', SCHEMA_COMMON)
export const newsModel = model<IDefinitionCommon>('news', SCHEMA_COMMON)
export const courseModel = model<IDefinitionCommon>('course', SCHEMA_COMMON)
export const statesModel = model<IDefinitionCommon>('states', SCHEMA_COMMON)
export const scheduleModel = model<IDefinitionCommon>('schedules', SCHEMA_COMMON)
export const guideModel = model<IDefinitionCommon>('guides', SCHEMA_COMMON)
export const contactModel = model<IContact>('contacts', ContactSchema)
