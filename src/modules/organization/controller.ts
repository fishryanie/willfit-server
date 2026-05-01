import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { organizationValidationSchema } from 'modules/organization/validation'
import { statesModel } from 'modules/common/models'
import { orgBranchModel, orgCategoryModel, orgModel } from './models'

//#region Organization
export const getAllOrganizations = async (req: Request, res: Response) => {
  // #swagger.tags = ['Organization']
  try {
    const project = { __v: 0, createdAt: 0, updatedAt: 0 }
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    const [total, list] = await Promise.all([
      orgModel.countDocuments().exec(),
      orgModel.find({}, project).populate('categoryId', ['category', 'description']).skip(skip).limit(limit).exec()
    ])
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const findOrganizationDetail = async (req: Request, res: Response) => {
  // #swagger.tags = ['Organization']
  try {
    const orgId = req.params.id?.toString()
    const Org = await orgModel.findById(orgId)
    if (!Org) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found organization with id ${orgId}`
      })
      return
    }
    res.status(StatusCodes.OK).send({ record: Org, message: ReasonPhrases.OK })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const createOrganization = async (req: Request, res: Response) => {
  // #swagger.tags = ['Organization']
  try {
    const { error } = organizationValidationSchema.validate(req.body)
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.details[0].message })
      return
    }
    const Category = await orgCategoryModel.findById(req.body.categoryId)
    if (!Category) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found category with id ${req.body.organizationId}`
      })
      return
    }
    const newOrg = new orgModel({
      name: req.body.name,
      categoryId: req.body.categoryId,
      address: req.body.address,
      status: req.body.status,
      taxId: req.body.taxId,
      contactName: req.body.contactName,
      contactEmail: req.body.contactEmail,
      contactTitle: req.body.contactTitle,
      contactPhone: req.body.contactPhone
    })
    await newOrg.validate()
    await newOrg.save()
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const getSelectOrganization = async (req: Request, res: Response) => {
  // #swagger.tags = ['Organization']
  try {
    const org = await orgModel.findById(req.query.id)
    if (!org) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found organization with id ${req.query.id}`
      })
      return
    }
    const locations = await orgBranchModel.aggregate([
      { $match: { organizationId: org._id } },
      { $group: { _id: '$locationId' } },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'locationInfo'
        }
      },
      {
        $unwind: {
          path: '$locationInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: { stateId: '$_id' }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$locationInfo', '$$ROOT']
          }
        }
      },
      {
        $project: {
          locationInfo: 0,
          _id: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0
        }
      }
    ])
    const branches = await orgBranchModel.aggregate([
      {
        $match: { organizationId: org._id }
      },
      {
        $group: {
          _id: '$locationId',
          branches: {
            $push: {
              branchId: '$_id',
              name: '$name',
              address: '$address',
              capacity: '$capacity',
              type: '$type'
            }
          },
          totalBranches: {
            $sum: 1
          }
        }
      },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'locationInfo'
        }
      },
      {
        $unwind: {
          path: '$locationInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          stateId: '$_id'
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$locationInfo', '$$ROOT']
          }
        }
      },
      {
        $project: {
          locationInfo: 0,
          _id: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0
        }
      }
    ])
    res.status(StatusCodes.OK).send({ code: StatusCodes.OK, message: ReasonPhrases.OK, data: { locations, branches } })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}
//#endregion Organization

//#region Branch
export const getListBranch = async (req: Request, res: Response) => {
  // #swagger.tags = ['Organization']
  try {
    const query: Partial<IOrgBranch> = {}
    const project = { __v: 0, createdAt: 0, updatedAt: 0 }
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const skip = (page - 1) * limit
    const organizationId = req.query.organizationId as string
    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      query['organizationId'] = new mongoose.Types.ObjectId(organizationId)
    }
    const [total, list] = await Promise.all([
      orgBranchModel.countDocuments().exec(),
      orgBranchModel.find(query, project).skip(skip).limit(limit).exec()
    ])
    const totalPages = Math.ceil(total / limit)
    res.status(StatusCodes.OK).send({ list, limit, total, page, totalPages, message: ReasonPhrases.OK })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const createBranch = async (req: Request, res: Response) => {
  // #swagger.tags = ['Organization']
  try {
    const organization = await orgModel.findOne({ _id: req.body.organizationId })
    if (!organization) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found organization with id ${req.body.organizationId}`
      })
      return
    }
    const states = await statesModel.findOne({ name: req.body.location })
    if (states === null) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.BAD_REQUEST,
        message: `Not found location with id ${req.body.location}`
      })
      return
    }
    const newBranch = new orgBranchModel({
      locationId: states._id,
      organizationId: organization._id,
      address: req.body.address,
      capacity: req.body.capacity,
      name: req.body.name,
      phone: req.body.phone,
      type: req.body.type
    })
    await newBranch.validate()
    await newBranch.save()
    res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}
//#endregion Branch
