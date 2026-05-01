import type { Model, QueryOptions } from 'mongoose'
import type { Request, Response, Router } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

interface BaseQueryOptions {
  populate?: {
    path: string
    select: string[]
  }[]
}

export const baseRESTful = <T>(path: string, router: Router, model: Model<T>, options?: BaseQueryOptions) => {
  router.get(path, baseQueries(model, options))
  router.post(path, baseCreate(model))
  router.get(`${path}/:id`, baseQueryById(model, options))
  router.put(`${path}/:id`, baseUpdate(model))
  router.delete(`${path}/:id`, baseDelete(model))
}

export const baseQueries = <T>(model: Model<T>, options?: BaseQueryOptions) => {
  return async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 20
      const page = Number(req.query.page) || 1
      const skip = (page - 1) * limit
      delete req.query.page
      delete req.query.limit
      let query = model
        .find(req.query as QueryOptions<T>)
        .select('-__v')
        .skip(skip)
        .limit(limit)
      if (options?.populate) {
        options.populate.forEach((pop) => {
          query = query.populate(pop.path, pop.select.join(' '))
        })
      }
      const [total, list] = await Promise.all([model.countDocuments(req.query as QueryOptions<T>).exec(), query.exec()])
      const totalPages = Math.ceil(total / limit)
      res.status(StatusCodes.OK).send({ list, limit, total, totalPages, message: ReasonPhrases.OK })
    } catch (error) {
      if (error instanceof Error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
      }
    }
  }
}

export const baseQueryById = <T>(model: Model<T>, options?: BaseQueryOptions) => {
  return async (req: Request, res: Response) => {
    try {
      let query = model.findById(req.params.id).select('-__v')
      if (options?.populate) {
        options.populate.forEach((pop) => {
          query = query.populate(pop.path, pop.select.join(' '))
        })
      }
      const document = await query.exec()
      if (!document) {
        res.status(StatusCodes.NOT_FOUND).send({ message: ReasonPhrases.NOT_FOUND })
        return
      }
      res.status(StatusCodes.OK).send({ record: document, message: ReasonPhrases.OK })
    } catch (error) {
      if (error instanceof Error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
      }
    }
  }
}

export const baseCreate = <T>(modal: Model<T>) => {
  return async (req: Request, res: Response) => {
    try {
      const newObject = new modal(req.body)
      await newObject.validate()
      await newObject.save()
      res.status(StatusCodes.CREATED).send({ message: ReasonPhrases.CREATED })
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(StatusCodes.BAD_REQUEST).send({ error, code: StatusCodes.BAD_REQUEST, message: error.message })
        return
      }
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
    }
  }
}

export const baseUpdate = <T>(model: Model<T>) => {
  return async (req: Request, res: Response) => {
    try {
      const updatedObject = await model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      if (!updatedObject) {
        res.status(StatusCodes.NOT_FOUND).send({ message: ReasonPhrases.NOT_FOUND })
        return
      }
      res.status(StatusCodes.OK).send({ message: ReasonPhrases.OK, record: updatedObject })
    } catch (error) {
      if (error instanceof Error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
      }
    }
  }
}

export const baseDelete = <T>(model: Model<T>) => {
  return async (req: Request, res: Response) => {
    try {
      const deletedObject = await model.findByIdAndDelete(req.params.id)
      if (!deletedObject) {
        res.status(StatusCodes.NOT_FOUND).send({ message: ReasonPhrases.NOT_FOUND })
        return
      }
      res.status(StatusCodes.OK).send({ message: ReasonPhrases.OK })
    } catch (error) {
      if (error instanceof Error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
      }
    }
  }
}
