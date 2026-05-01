import { Schema, type SchemaOptions } from 'mongoose'

export const definition = {
  name: { type: String, required: true },
  imageUrl: { type: String, required: false },
  videoUrl: { type: String, required: false },
  description: { type: String, required: false },
  content: { type: String, required: false }
}
export const OPTIONS = { timestamps: true, autoIndex: true, versionKey: false } satisfies SchemaOptions
export const SCHEMA_COMMON = new Schema<IDefinitionCommon>(definition, OPTIONS)
