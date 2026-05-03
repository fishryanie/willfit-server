import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

@Schema({ timestamps: true })
export class Assessment {
  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: String, required: true })
  duration!: string

  @Prop({ type: String, required: true })
  level!: string

  @Prop({ type: String, required: true })
  description!: string
}

export const assessmentSchema = SchemaFactory.createForClass(Assessment)
