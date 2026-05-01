import Joi from 'joi'

export const createAdminDto = Joi.object<IAdmin & IUser>({
  phone: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
  gender: Joi.number().valid(0, 1).required()
})
