import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { EnumTypePlan } from 'enums/common'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'
import type { Model } from 'mongoose'

@Injectable()
export class MealPlanService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @InjectModel(MODEL_NAMES.plan) private readonly planModel: Model<any>
  ) {}

  list(query: CrudListQuery) {
    return this.crud.list(
      this.planModel,
      { ...query, type: query.type || EnumTypePlan.MEAL },
      {
        populate: [
          { path: 'level', select: '-__v' },
          { path: 'schedule', select: '-__v' }
        ],
        searchFields: ['name', 'description', 'content']
      }
    )
  }

  getById(id: string, includeDeleted?: boolean) {
    return this.crud.getById(
      this.planModel,
      id,
      {
        populate: [
          { path: 'level', select: '-__v' },
          { path: 'schedule', select: '-__v' }
        ]
      },
      includeDeleted
    )
  }

  create(payload: Record<string, unknown>) {
    this.validatePayload(payload, false)
    return this.crud.create(this.planModel, { ...payload, type: payload.type || EnumTypePlan.MEAL })
  }

  update(id: string, payload: Record<string, unknown>, replace = false) {
    this.validatePayload(payload, !replace)
    return this.crud.update(this.planModel, id, payload, replace)
  }

  delete(id: string) {
    return this.crud.softDelete(this.planModel, id)
  }

  restore(id: string) {
    return this.crud.restore(this.planModel, id)
  }

  async duplicate(id: string) {
    const { record } = await this.getById(id, false)
    const source = record.toObject ? record.toObject() : record
    delete source._id
    delete source.createdAt
    delete source.updatedAt
    return this.create({ ...source, name: `${source.name} Copy` })
  }

  private validatePayload(payload: Record<string, unknown>, partial: boolean) {
    if (!partial && typeof payload.name !== 'string') throw new BadRequestException('name is required')
    if (!partial && typeof payload.duration !== 'string') throw new BadRequestException('duration is required')
    if (!partial && typeof payload.level !== 'string') throw new BadRequestException('level is required')
    if (payload.mealItems !== undefined && !Array.isArray(payload.mealItems)) {
      throw new BadRequestException('mealItems must be an array')
    }
  }
}
