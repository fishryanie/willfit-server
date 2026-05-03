import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import mongoose, { Model, Types } from 'mongoose'

type PopulateOption = Parameters<ReturnType<Model<any>['find']>['populate']>[0]

export interface CrudListQuery {
  page?: string | number
  limit?: string | number
  includeDeleted?: string | boolean
  onlyDeleted?: string | boolean
  sort?: string
  [key: string]: unknown
}

export interface CrudOptions {
  populate?: PopulateOption[]
  searchFields?: string[]
  defaultSort?: Record<string, 1 | -1>
}

const toBoolean = (value: unknown) => value === true || value === 'true' || value === '1'

@Injectable()
export class CrudService {
  private ensureSoftDeletePath(model: Model<any>) {
    if (!model.schema.path('deletedAt')) {
      model.schema.add({ deletedAt: { type: Date, required: false, default: null, index: true } })
    }
  }

  parsePagination(query: CrudListQuery = {}, maxLimit = 100) {
    const rawLimit = Number(query.limit)
    const rawPage = Number(query.page)
    const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20, maxLimit)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    return { limit, page, skip: (page - 1) * limit }
  }

  buildFilter(query: CrudListQuery, options: CrudOptions = {}) {
    const { page, limit, includeDeleted, onlyDeleted, sort, search, ...rest } = query
    const filter: Record<string, unknown> = {}

    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
        filter[key] = new Types.ObjectId(value)
        return
      }
      filter[key] = value
    })

    if (typeof search === 'string' && search.trim() && options.searchFields?.length) {
      filter.$or = options.searchFields.map((field) => ({ [field]: { $regex: search.trim(), $options: 'i' } }))
    }

    if (toBoolean(onlyDeleted)) {
      filter.deletedAt = { $ne: null }
    } else if (!toBoolean(includeDeleted)) {
      filter.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    }

    return filter
  }

  async list(model: Model<any>, query: CrudListQuery = {}, options: CrudOptions = {}) {
    this.ensureSoftDeletePath(model)
    const { limit, page, skip } = this.parsePagination(query)
    const filter = this.buildFilter(query, options)
    let findQuery = model
      .find(filter)
      .select('-__v')
      .sort(options.defaultSort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)

    options.populate?.forEach((populate) => {
      findQuery = findQuery.populate(populate)
    })

    const [total, list] = await Promise.all([model.countDocuments(filter).exec(), findQuery.exec()])
    return { list, limit, total, page, totalPages: Math.ceil(total / limit), message: 'OK' }
  }

  async getById(model: Model<any>, id: string, options: CrudOptions = {}, includeDeleted = false) {
    this.ensureSoftDeletePath(model)
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id')
    const filter: Record<string, unknown> = { _id: id }
    if (!includeDeleted) {
      filter.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    }
    let query = model.findOne(filter).select('-__v')
    options.populate?.forEach((populate) => {
      query = query.populate(populate)
    })
    const record = await query.exec()
    if (!record) throw new NotFoundException('Not found')
    return { record, message: 'OK' }
  }

  async create(model: Model<any>, payload: Record<string, unknown>) {
    this.ensureSoftDeletePath(model)
    const record = await model.create({ ...payload, deletedAt: null })
    return { record, message: 'Created' }
  }

  async update(model: Model<any>, id: string, payload: Record<string, unknown>, replace = false) {
    this.ensureSoftDeletePath(model)
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id')
    const update = replace ? { ...payload, deletedAt: payload.deletedAt ?? null } : { $set: payload }
    const record = await model.findOneAndUpdate({ _id: id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }, update, {
      new: true,
      runValidators: true
    })
    if (!record) throw new NotFoundException('Not found')
    return { record, message: 'OK' }
  }

  async softDelete(model: Model<any>, id: string) {
    this.ensureSoftDeletePath(model)
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id')
    const record = await model.findOneAndUpdate(
      { _id: id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )
    if (!record) throw new NotFoundException('Not found')
    return { record, message: 'OK' }
  }

  async restore(model: Model<any>, id: string) {
    this.ensureSoftDeletePath(model)
    if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id')
    const record = await model.findByIdAndUpdate(id, { $set: { deletedAt: null } }, { new: true })
    if (!record) throw new NotFoundException('Not found')
    return { record, message: 'OK' }
  }
}
