import Joi from 'joi'

export const insertValidationSchema = Joi.object<IInsertClientRequest>({
  memberId: Joi.string().required(),
  phone: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
  email: Joi.string().required().email(),
  gender: Joi.number().valid(0, 1).required(),
  medicalHistory: Joi.boolean().required(),
  medicalConditions: Joi.array().items(Joi.string()).min(1).required(),
  emergencyContact: Joi.string().required(),
  emergencyPhone: Joi.string().required(),
  avatarUrl: Joi.string().optional(),
  medicalDetail: Joi.string(),
  password: Joi.string().required()
})

export const updateClientValidationSchema = Joi.object<IUpdateClientRequest>({
  memberId: Joi.string().required(),
  phone: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
  email: Joi.string().required().email(),
  gender: Joi.number().valid(0, 1).required(),
  medicalHistory: Joi.boolean().required(),
  medicalConditions: Joi.array().items(Joi.string()).min(1).required(),
  emergencyContact: Joi.string().required(),
  emergencyPhone: Joi.string().required(),
  avatarUrl: Joi.string().allow('').optional(),
  medicalDetail: Joi.string()
})
