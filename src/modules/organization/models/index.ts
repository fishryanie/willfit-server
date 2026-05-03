import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { OPTIONS } from 'constants/schema'
import { Types } from 'mongoose'

@Schema(OPTIONS)
export class OrganizationBranch implements IOrgBranch {
  @Prop({ type: String, required: true })
  address!: string

  @Prop({ type: Number, required: true })
  capacity!: number

  @Prop({ type: Types.ObjectId, required: true })
  locationId!: Types.ObjectId

  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: Types.ObjectId, required: true, ref: 'organization' })
  organizationId!: Types.ObjectId

  @Prop({ type: String, required: true })
  phone!: string

  @Prop({ type: String, required: true })
  type!: string
}

export const orgBranchSchema = SchemaFactory.createForClass(OrganizationBranch)

@Schema(OPTIONS)
export class Organization implements IOrganization {
  @Prop({ type: String, required: true })
  address!: string

  @Prop({ type: Types.ObjectId, required: true, ref: 'organization_categories' })
  categoryId!: Types.ObjectId

  @Prop({ type: String, required: true })
  contactEmail!: string

  @Prop({ type: String, required: true })
  contactName!: string

  @Prop({ type: String, required: true })
  contactPhone!: string

  @Prop({ type: String, required: true })
  contactTitle!: string

  @Prop({ type: String, required: true })
  name!: string

  @Prop({ type: Boolean, required: true })
  status!: boolean

  @Prop({ type: String, required: true })
  taxId!: string
}

export const orgSchema = SchemaFactory.createForClass(Organization)
