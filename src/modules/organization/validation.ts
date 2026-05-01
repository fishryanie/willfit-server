import Joi from 'joi'

export const organizationValidationSchema = Joi.object<IOrganization>({
  address: Joi.string().required(),
  categoryId: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  contactName: Joi.string().required(),
  contactPhone: Joi.string().required(),
  contactTitle: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.boolean().required(),
  taxId: Joi.string().required()
})
