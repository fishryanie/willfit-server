import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { SchemaOptions } from 'mongoose'

export const OPTIONS = { timestamps: true, autoIndex: true, versionKey: false } satisfies SchemaOptions

@Schema(OPTIONS)
export class CommonDefinition {
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
}

export const SCHEMA_COMMON = SchemaFactory.createForClass(CommonDefinition)
