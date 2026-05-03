import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import mongoose, { type Model } from 'mongoose'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @InjectModel(MODEL_NAMES.organization) private readonly orgModel: Model<IOrganization>,
    @InjectModel(MODEL_NAMES.organizationBranch) private readonly orgBranchModel: Model<IOrgBranch>,
    @InjectModel(MODEL_NAMES.organizationCategory) private readonly orgCategoryModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.states) private readonly statesModel: Model<IDefinitionCommon>
  ) {}

  list(query: CrudListQuery) {
    return this.crud.list(this.orgModel, query, {
      populate: [{ path: 'categoryId', select: 'category description' }],
      searchFields: ['name', 'address', 'contactEmail']
    })
  }
  get(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.orgModel, id, { populate: [{ path: 'categoryId', select: 'category description' }] }, includeDeleted)
  }
  create(body: Record<string, unknown>) {
    return this.crud.create(this.orgModel, body)
  }
  update(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.orgModel, id, body, replace)
  }
  delete(id: string) {
    return this.crud.softDelete(this.orgModel, id)
  }
  restore(id: string) {
    return this.crud.restore(this.orgModel, id)
  }

  categories(query: CrudListQuery) {
    return this.crud.list(this.orgCategoryModel, query, { searchFields: ['name', 'description'] })
  }
  category(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.orgCategoryModel, id, {}, includeDeleted)
  }
  createCategory(body: Record<string, unknown>) {
    return this.crud.create(this.orgCategoryModel, body)
  }
  updateCategory(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.orgCategoryModel, id, body, replace)
  }
  deleteCategory(id: string) {
    return this.crud.softDelete(this.orgCategoryModel, id)
  }
  restoreCategory(id: string) {
    return this.crud.restore(this.orgCategoryModel, id)
  }

  branches(query: CrudListQuery) {
    return this.crud.list(this.orgBranchModel, query, { searchFields: ['name', 'address', 'phone'] })
  }
  branch(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.orgBranchModel, id, {}, includeDeleted)
  }
  async createBranch(body: Record<string, unknown>) {
    const organizationId = String(body.organizationId || '')
    if (!mongoose.Types.ObjectId.isValid(organizationId)) throw new BadRequestException('organizationId is required')
    const organization = await this.orgModel.findById(organizationId).exec()
    if (!organization) throw new NotFoundException(`Not found organization with id ${organizationId}`)
    const state = await this.statesModel.findOne({ name: (body as any).location }).exec()
    if (!state) throw new NotFoundException(`Not found location with id ${String(body.location || '')}`)
    return this.crud.create(this.orgBranchModel, { ...body, organizationId: organization._id, locationId: state._id })
  }
  updateBranch(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.orgBranchModel, id, body, replace)
  }
  deleteBranch(id: string) {
    return this.crud.softDelete(this.orgBranchModel, id)
  }
  restoreBranch(id: string) {
    return this.crud.restore(this.orgBranchModel, id)
  }
}
