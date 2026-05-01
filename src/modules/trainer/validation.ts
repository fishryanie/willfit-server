import Joi from 'joi'
import mongoose from 'mongoose'

export const createOrgStaffValidationSchema = Joi.object<IInsertOrgStaffRequest>({
  memberId: Joi.string().required(),
  phone: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required(),
  address: Joi.string().required(),
  role: Joi.string().required(),
  branch: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message({ en: 'Invalid ID' })
      }
      return value
    }),
  states: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message({ en: 'Invalid ID' })
      }
      return value
    })
})
