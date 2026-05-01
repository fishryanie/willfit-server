import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { staffModel, userModel } from 'models'
import { createStaffDto } from './staffValidation'
import mongoose from 'mongoose'
import { orgModel } from 'modules/organization/models'

export const findAllStaff = async (req: Request, res: Response) => {
  try {
    const project = { __v: 0 }
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    const [total, list] = await Promise.all([
      staffModel.countDocuments().exec(),
      staffModel
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

export const findStaffDetail = async (req: Request, res: Response) => {
  try {
    const staffId = req.query.staffId?.toString()
    const Staff = await staffModel.findById(staffId)
    if (!Staff) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found staff with id ${staffId}`
      })
      return
    }
    res.status(StatusCodes.OK).send({ record: Staff, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const createNewStaff = async (req: Request, res: Response) => {
  try {
    const { error, value } = createStaffDto.validate(req.body)
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
    const Org = await orgModel.findById(req.body.organizationId)
    const newStaff = new staffModel({
      userId: newUser._id,
      organizationId: Org?._id,
      memberId: value.memberId
    })
    await newStaff.save()
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}
