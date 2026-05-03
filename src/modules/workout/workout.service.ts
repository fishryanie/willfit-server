import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import mongoose, { Types, type Model } from 'mongoose'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'

const exercisePopulate = [
  { path: 'goal', select: '-__v' },
  { path: 'level', select: '-__v' },
  { path: 'muscle', select: '-__v' },
  { path: 'category', select: '-__v' },
  { path: 'equipment', select: '-__v' }
]

const musclePopulate = [{ path: 'category', select: '-__v' }]

const sessionPopulate = [
  {
    path: 'exercises.exercise',
    select: '-content',
    model: 'exercises',
    populate: [
      { path: 'muscle', model: 'muscles' },
      { path: 'equipment', model: 'equipments' },
      { path: 'goal', model: 'exercise_goals' },
      { path: 'level', model: 'exercise_levels' }
    ]
  },
  { path: 'exercises.schedule', model: 'schedules' },
  { path: 'client', select: '-__v' }
]

const catalogResources = ['equipment', 'muscles-categories', 'exercise-goals', 'exercise-level', 'exercise-categories', 'exercise', 'muscles'] as const
type CatalogResource = (typeof catalogResources)[number]

@Injectable()
export class WorkoutService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @InjectModel(MODEL_NAMES.client) private readonly clientModel: Model<IClient>,
    @InjectModel(MODEL_NAMES.equipment) private readonly equipmentModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.muscleCategory) private readonly muscleCategoriesModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.exerciseGoal) private readonly exerciseGoalModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.exerciseLevel) private readonly exerciseLevelModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.exerciseCategory) private readonly exerciseCategoriesModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.exercise) private readonly exerciseModel: Model<IExercise>,
    @InjectModel(MODEL_NAMES.muscle) private readonly muscleModel: Model<any>,
    @InjectModel(MODEL_NAMES.workoutSession) private readonly workoutSessionModel: Model<IWorkoutSession>
  ) {}

  getCatalogModel(resource: CatalogResource) {
    const model = {
      equipment: this.equipmentModel,
      'muscles-categories': this.muscleCategoriesModel,
      'exercise-goals': this.exerciseGoalModel,
      'exercise-level': this.exerciseLevelModel,
      'exercise-categories': this.exerciseCategoriesModel,
      exercise: this.exerciseModel,
      muscles: this.muscleModel
    }[resource]
    if (!model) throw new NotFoundException('Workout resource not found')
    return model
  }

  getCatalogOptions(resource: CatalogResource) {
    if (resource === 'exercise') return { populate: exercisePopulate, searchFields: ['name', 'description'] }
    if (resource === 'muscles') return { populate: musclePopulate, searchFields: ['name', 'description'] }
    return { searchFields: ['name', 'description'] }
  }

  listCatalog(resource: CatalogResource, query: CrudListQuery) {
    return this.crud.list(this.getCatalogModel(resource), query, this.getCatalogOptions(resource))
  }

  getCatalogById(resource: CatalogResource, id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.getCatalogModel(resource), id, this.getCatalogOptions(resource), includeDeleted)
  }

  createCatalog(resource: CatalogResource, payload: Record<string, unknown>) {
    return this.crud.create(this.getCatalogModel(resource), payload)
  }

  updateCatalog(resource: CatalogResource, id: string, payload: Record<string, unknown>, replace = false) {
    return this.crud.update(this.getCatalogModel(resource), id, payload, replace)
  }

  deleteCatalog(resource: CatalogResource, id: string) {
    return this.crud.softDelete(this.getCatalogModel(resource), id)
  }

  restoreCatalog(resource: CatalogResource, id: string) {
    return this.crud.restore(this.getCatalogModel(resource), id)
  }

  async createSession(payload: Record<string, unknown>) {
    if (!payload.client || !mongoose.Types.ObjectId.isValid(payload.client as string)) {
      throw new BadRequestException('client is required')
    }
    if (!Array.isArray(payload.exercises) || payload.exercises.length === 0) {
      throw new BadRequestException('exercises is required')
    }
    return this.crud.create(this.workoutSessionModel, payload)
  }

  listSessions(query: CrudListQuery) {
    return this.crud.list(this.workoutSessionModel, query, {
      populate: sessionPopulate,
      searchFields: ['name', 'description']
    })
  }

  getSessionById(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.workoutSessionModel, id, { populate: sessionPopulate }, includeDeleted)
  }

  updateSession(id: string, payload: Record<string, unknown>, replace = false) {
    return this.crud.update(this.workoutSessionModel, id, payload, replace)
  }

  deleteSession(id: string) {
    return this.crud.softDelete(this.workoutSessionModel, id)
  }

  restoreSession(id: string) {
    return this.crud.restore(this.workoutSessionModel, id)
  }

  async getSessionsForCurrentClient(userId: string | undefined, query: CrudListQuery) {
    if (!userId) throw new BadRequestException('Missing current user')
    const client = await this.clientModel.findById(userId).select('_id').exec()
    if (!client) throw new NotFoundException(`Not found client with id ${userId}`)
    return this.crud.list(this.workoutSessionModel, { ...query, client: (client._id as Types.ObjectId).toString() }, { populate: sessionPopulate })
  }
}
