import Joi from 'joi'

export const createStaffDto = Joi.object<IStaff & IUser>({
  memberId: Joi.string().required(),
  phone: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
  gender: Joi.number().valid(0, 1).required()
})
