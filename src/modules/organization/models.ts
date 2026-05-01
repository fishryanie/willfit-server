import { OPTIONS, SCHEMA_COMMON } from 'constants/schema'
import { model, Schema } from 'mongoose'

export const orgBranchSchema = new Schema<IOrgBranch>(
  {
    address: { type: String, required: true },
    capacity: { type: Number, required: true },
    locationId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: 'organization' },
    phone: { type: String, required: true },
    type: { type: String, required: true }
  },
  OPTIONS
)

const orgSchema = new Schema<IOrganization>(
  {
    address: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, required: true, ref: 'organization_categories' },
    contactEmail: { type: String, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactTitle: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: Boolean, required: true },
    taxId: { type: String, required: true }
  },
  OPTIONS
)

export const orgModel = model<IOrganization>('organizations', orgSchema)
export const orgBranchModel = model<IOrgBranch>('organization_branches', orgBranchSchema)
export const orgCategoryModel = model<IDefinitionCommon>('organization_categories', SCHEMA_COMMON)
