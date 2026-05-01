import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { accountRoleModel, accountStatusModel } from 'modules/auth/models'
import { RoleAccount, StatusAccount } from 'enums/common'
import { trainerModel } from './models'
import { accountTokenModel, userModel } from 'models'
import { createOrgStaffValidationSchema } from './validation'

export const getTrainer = async (req: Request, res: Response) => {
  // #swagger.tags = ['Trainer']
  try {
    const project = { __v: 0, createdAt: 0, updatedAt: 0 }
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    delete req.query.limit
    delete req.query.page
    const [total, list] = await Promise.all([
      trainerModel.countDocuments().exec(),
      trainerModel
        .find({}, project)
        .populate('branch', '-__v')
        .populate('status', '-__v')
        .skip(skip)
        .limit(limit)
        .exec()
    ])
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const createTrainer = async (req: Request, res: Response) => {
  // #swagger.tags = ['Trainer']
  try {
    const { error, value } = createOrgStaffValidationSchema.validate(req.body)
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.details[0].message })
      return
    }
    const [ROLE, STATUS] = await Promise.all([
      accountRoleModel.findOne({ name: RoleAccount.TRAINER }),
      accountStatusModel.findOne({ name: StatusAccount.PENDING_VERIFICATION })
    ])
    const hashedPassword = await bcrypt.hash(value.password, 10)
    const newUser = new userModel({
      phone: value.phone,
      states: value.states,
      address: value.address,
      fullName: value.fullName,
      dateOfBirth: value.dateOfBirth
    })
    const newTrainer = new trainerModel({
      userInfo: newUser['_id'],
      memberId: value.memberId,
      email: value.email,
      branch: value.branch
    })
    const newAccountToken = new accountTokenModel({
      name: value.fullName,
      username: value.email,
      password: hashedPassword,
      accountId: newTrainer['_id'],
      status: STATUS!['_id'],
      role: ROLE!['_id']
    })
    await Promise.all([newUser.save(), newTrainer.save(), newAccountToken.save()])
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}
