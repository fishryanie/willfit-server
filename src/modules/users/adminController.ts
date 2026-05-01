import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { adminModel, userModel } from 'models'
import { createAdminDto } from './adminValidation'
import mongoose from 'mongoose'

export const findAllAdmin = async (req: Request, res: Response) => {
  try {
    const project = { __v: 0 }
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    const [total, list] = await Promise.all([
      adminModel.countDocuments().exec(),
      adminModel
        .find({}, project)
        .populate('userId', ['fullName', 'phone', 'gender', 'dateOfBirth', '-_id'])
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

export const findAdminDetail = async (req: Request, res: Response) => {
  try {
    const adminId = req.query.adminId?.toString()
    const Admin = await adminModel.findById(adminId)
    if (!Admin) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found admin with id ${adminId}`
      })
      return
    }
    res.status(StatusCodes.OK).send({ record: Admin, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const createNewAdmin = async (req: Request, res: Response) => {
  try {
    const { error, value } = createAdminDto.validate(req.body)
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.details[0].message })
      return
    }
    const newUser = new userModel({
      gender: value.gender,
      phone: value.phone,
      fullName: value.fullName,
      dateOfBirth: value.dateOfBirth
    })
    await newUser.save()
    const newAdmin = new adminModel({
      userId: newUser._id
    })
    await newAdmin.save()
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}
