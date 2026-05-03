import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import bcrypt from 'bcryptjs'
import { RoleAccount, StatusAccount } from 'enums/common'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'
import type { Model } from 'mongoose'

@Injectable()
export class AccountsService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @InjectModel(MODEL_NAMES.accountRole) private readonly accountRoleModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.accountStatus) private readonly accountStatusModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.accountToken) private readonly accountTokenModel: Model<IAccountToken>,
    @InjectModel(MODEL_NAMES.client) private readonly clientModel: Model<IClient>,
    @InjectModel(MODEL_NAMES.trainer) private readonly trainerModel: Model<ITrainer>,
    @InjectModel(MODEL_NAMES.user) private readonly userModel: Model<IUser>,
    @InjectModel(MODEL_NAMES.admin) private readonly adminModel: Model<IAdmin>,
    @InjectModel(MODEL_NAMES.staff) private readonly staffModel: Model<IStaff>
  ) {}

  listClients(query: CrudListQuery) {
    return this.crud.list(this.clientModel, query, {
      populate: [{ path: 'userInfo', select: 'fullName phone gender dateOfBirth' }],
      searchFields: ['email', 'memberId']
    })
  }
  client(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.clientModel, id, { populate: [{ path: 'userInfo', select: 'fullName phone gender dateOfBirth' }] }, includeDeleted)
  }
  updateClient(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.clientModel, id, body, replace)
  }
  deleteClient(id: string) {
    return this.crud.softDelete(this.clientModel, id)
  }
  restoreClient(id: string) {
    return this.crud.restore(this.clientModel, id)
  }

  async createClient(body: Record<string, unknown>, trainerId?: string) {
    const payload = body as any
    const [role, status] = await Promise.all([
      this.accountRoleModel.findOne({ name: RoleAccount.CLIENT }),
      this.accountStatusModel.findOne({ name: StatusAccount.PENDING_VERIFICATION })
    ])
    const user = await this.userModel.create({ gender: payload.gender, phone: payload.phone, fullName: payload.fullName, dateOfBirth: payload.dateOfBirth })
    const client = await this.clientModel.create({ ...payload, userInfo: user._id, trainer: trainerId ? [trainerId] : payload.trainer || [] })
    if (payload.password) {
      await this.accountTokenModel.create({
        accountId: client._id,
        name: payload.fullName,
        username: payload.email,
        password: await bcrypt.hash(String(payload.password), 10),
        status: status?._id,
        role: role?._id
      })
    }
    return { record: client, message: 'Created' }
  }

  listTrainers(query: CrudListQuery) {
    return this.crud.list(this.trainerModel, query, { populate: [{ path: 'branch', select: '-__v' }], searchFields: ['email', 'memberId', 'specialization'] })
  }
  trainer(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.trainerModel, id, { populate: [{ path: 'branch', select: '-__v' }] }, includeDeleted)
  }
  async createTrainer(body: Record<string, unknown>) {
    const payload = body as any
    const [role, status] = await Promise.all([
      this.accountRoleModel.findOne({ name: RoleAccount.TRAINER }),
      this.accountStatusModel.findOne({ name: StatusAccount.PENDING_VERIFICATION })
    ])
    const user = await this.userModel.create({
      phone: payload.phone,
      states: payload.states,
      address: payload.address,
      fullName: payload.fullName,
      dateOfBirth: payload.dateOfBirth
    })
    const trainer = await this.trainerModel.create({ ...payload, userInfo: user._id })
    if (payload.password) {
      await this.accountTokenModel.create({
        accountId: trainer._id,
        name: payload.fullName,
        username: payload.email,
        password: await bcrypt.hash(String(payload.password), 10),
        status: status?._id,
        role: role?._id
      })
    }
    return { record: trainer, message: 'Created' }
  }
  updateTrainer(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.trainerModel, id, body, replace)
  }
  deleteTrainer(id: string) {
    return this.crud.softDelete(this.trainerModel, id)
  }
  restoreTrainer(id: string) {
    return this.crud.restore(this.trainerModel, id)
  }

  listAdmins(query: CrudListQuery) {
    return this.crud.list(this.adminModel, query, { populate: [{ path: 'userId', select: 'fullName phone gender dateOfBirth' }] })
  }
  admin(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.adminModel, id, { populate: [{ path: 'userId', select: 'fullName phone gender dateOfBirth' }] }, includeDeleted)
  }
  async createAdmin(body: Record<string, unknown>) {
    const payload = body as any
    const user = await this.userModel.create({ gender: payload.gender, phone: payload.phone, fullName: payload.fullName, dateOfBirth: payload.dateOfBirth })
    return this.crud.create(this.adminModel, { userId: user._id })
  }
  updateAdmin(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.adminModel, id, body, replace)
  }
  deleteAdmin(id: string) {
    return this.crud.softDelete(this.adminModel, id)
  }
  restoreAdmin(id: string) {
    return this.crud.restore(this.adminModel, id)
  }

  listStaff(query: CrudListQuery) {
    return this.crud.list(this.staffModel, query, { populate: [{ path: 'userId', select: 'fullName phone gender dateOfBirth' }] })
  }
  staff(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.staffModel, id, { populate: [{ path: 'userId', select: 'fullName phone gender dateOfBirth' }] }, includeDeleted)
  }
  async createStaff(body: Record<string, unknown>) {
    const payload = body as any
    const user = await this.userModel.create({ gender: payload.gender, phone: payload.phone, fullName: payload.fullName, dateOfBirth: payload.dateOfBirth })
    return this.crud.create(this.staffModel, { userId: user._id, organizationId: payload.organizationId, memberId: payload.memberId })
  }
  updateStaff(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.staffModel, id, body, replace)
  }
  deleteStaff(id: string) {
    return this.crud.softDelete(this.staffModel, id)
  }
  restoreStaff(id: string) {
    return this.crud.restore(this.staffModel, id)
  }
}
