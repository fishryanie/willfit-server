import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import type { Response } from 'express'
import { RoleAccount, StatusAccount } from 'enums/common'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { accountTokenModel, clientModel, userModel } from 'models'
import { accountRoleModel, accountStatusModel } from 'modules/auth/models'
import { insertValidationSchema, updateClientValidationSchema } from './validation'

export const getClientList = async (req: TokenVerifiedRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    delete req.query.skip
    delete req.query.limit
    const [total, list] = await Promise.all([
      clientModel.countDocuments().exec(),
      clientModel
        .find({ trainer: { $in: req.tokenVerified?.userId ? [req.tokenVerified.userId] : [] } } as any)
        .populate('userInfo', ['fullName', 'phone', 'gender', 'dateOfBirth', '_id'])
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .exec()
    ])
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    console.error('getClientList failed:', error)
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}
export const clientProfile = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Client']
  try {
    const CLIENT = await clientModel
      .findOne(
        req.tokenVerified?.role.name === RoleAccount.TRAINER
          ? ({ _id: req.query.clientId, trainer: { $in: [req.tokenVerified.userId] } } as any)
          : ({ _id: req.tokenVerified?.userId } as any)
      )
      .populate('userInfo', ['fullName', 'phone', 'gender', 'dateOfBirth', '-_id'])
      .populate({
        path: 'trainer',
        populate: [
          { path: 'userInfo', select: '-_id' },
          { path: 'branch', select: '-__v' }
        ]
      })
      .exec()
    if (!CLIENT) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.NOT_FOUND,
        message: `Not found client with id ${req.tokenVerified?.userId}`
      })
      return
    }
    res.status(StatusCodes.OK).send({ record: CLIENT, message: ReasonPhrases.OK })
  } catch (error) {
    console.error('clientProfile failed:', error)
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}

export const updateClient = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Client']
  try {
    const { value, error } = updateClientValidationSchema.validate(req.body)
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.details[0].message })
      return
    }
    const CLIENT = await clientModel.findOneAndUpdate(
      req.tokenVerified?.role.name === RoleAccount.TRAINER
        ? { _id: req.query.clientId, trainer: { $in: [req.tokenVerified.userId] } }
        : { _id: req.tokenVerified?.userId },
      {
        email: value.email,
        avatarUrl: value.avatarUrl,
        emergencyPhone: value.emergencyPhone,
        emergencyContact: value.emergencyContact,
        medicalDetail: value.medicalDetail,
        medicalHistory: value.medicalHistory,
        medicalConditions: value.medicalConditions
      },
      { new: true }
    )
    if (!CLIENT) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.NOT_FOUND,
        message: `Not found client with id ${req.tokenVerified?.userId}`
      })
      return
    }
    await userModel.findOneAndUpdate(
      { _id: CLIENT['userInfo'] },
      {
        gender: value.gender,
        phone: value.phone,
        fullName: value.fullName,
        dateOfBirth: value.dateOfBirth
      },
      { new: true }
    )
    res.status(StatusCodes.OK).send({ record: CLIENT, message: ReasonPhrases.OK })
  } catch (error) {
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}

export const clientDeleteAccount = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Client']
  try {
    const Client = await clientModel.findByIdAndDelete(req.tokenVerified?.userId)
    if (!Client) {
      res.status(StatusCodes.NOT_FOUND).send({ message: `Not found client with id ${req.tokenVerified?.userId}` })
      return
    }
    await userModel.findByIdAndDelete(Client.userInfo)
    res.status(StatusCodes.OK).send({ message: ReasonPhrases.OK })
  } catch (error) {
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}

export const createNewClient = async (req: TokenVerifiedRequest, res: Response) => {
  try {
    const trainerId = req.tokenVerified?.userId
    const { error, value } = insertValidationSchema.validate(req.body)
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.details[0].message })
      return
    }
    const [ROLE, STATUS] = await Promise.all([
      accountRoleModel.findOne({ name: RoleAccount.CLIENT }),
      accountStatusModel.findOne({ name: StatusAccount.PENDING_VERIFICATION })
    ])
    const hashedPassword = await bcrypt.hash(value.password, 10)
    const newUser = new userModel({
      gender: value.gender,
      phone: value.phone,
      fullName: value.fullName,
      dateOfBirth: value.dateOfBirth
    })
    const newClient = new clientModel({
      userInfo: newUser._id,
      email: value.email,
      memberId: value.memberId,
      avatarUrl: value.avatarUrl,
      emergencyPhone: value.emergencyPhone,
      emergencyContact: value.emergencyContact,
      medicalDetail: value.medicalDetail,
      medicalHistory: value.medicalHistory,
      medicalConditions: value.medicalConditions,
      trainer: [trainerId]
    })
    const newAccountToken = new accountTokenModel({
      accountId: newClient['_id'],
      name: value.fullName,
      username: value.email,
      password: hashedPassword,
      status: STATUS!['_id'],
      role: ROLE!['_id']
    })
    await Promise.all([newUser.save(), newClient.save(), newAccountToken.save()])
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    } else if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}
