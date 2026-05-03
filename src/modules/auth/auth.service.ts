import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/mongoose'
import bcrypt from 'bcryptjs'
import { EXPIRES_REFRESH_TOKEN, EXPIRES_TOKEN } from 'constants/token'
import { StatusAccount } from 'enums/common'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { isExpoPushToken } from 'modules/notifications/push/send-notify'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'
import type { Model } from 'mongoose'

const refreshExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

const extractPushToken = (body: Record<string, unknown>) => {
  for (const key of ['expoPushToken', 'pushToken', 'fcmToken']) {
    const value = body[key]
    if (value === null) return ''
    if (typeof value === 'string') return value.trim()
  }
  return undefined
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @InjectModel(MODEL_NAMES.accountRole) private readonly accountRoleModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.accountStatus) private readonly accountStatusModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.accountToken) private readonly accountTokenModel: Model<IAccountToken>,
    @InjectModel(MODEL_NAMES.refreshToken) private readonly refreshTokenModel: Model<IRefreshToken>
  ) {}

  private jwtSecret() {
    return this.configService.get<string>('app.jwt.secret') || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2'
  }

  private jwtRefreshSecret() {
    return this.configService.get<string>('app.jwt.refreshSecret') || 'bAxsR8BVfj60DWXHE3u30oHzfl4G7khkSuPW'
  }

  private generateTokens(tokenPayload: TokenPayload): Tokens {
    return {
      accessToken: this.jwtService.sign(tokenPayload, { secret: this.jwtSecret(), expiresIn: EXPIRES_TOKEN }),
      refreshToken: this.jwtService.sign(tokenPayload, { secret: this.jwtRefreshSecret(), expiresIn: EXPIRES_REFRESH_TOKEN })
    }
  }

  async login(body: Record<string, unknown>) {
    const username = typeof body.username === 'string' ? body.username : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const account = await this.accountTokenModel.findOne({ username }).populate('role', 'name').populate('status', 'name').select('-__v').exec()
    if (!account || !(await bcrypt.compare(password, account.password))) throw new BadRequestException('Invalid username or password')

    const pushToken = extractPushToken(body)
    if (typeof pushToken === 'string' && pushToken !== account.fcmToken) {
      if (!pushToken || isExpoPushToken(pushToken)) {
        account.fcmToken = pushToken
        await account.save()
      }
    }

    const role = account.role as unknown as TokenPayload['role']
    const tokens = this.generateTokens({ userId: account.accountId, role, username: account.username })
    await this.refreshTokenModel.create({ token: tokens.refreshToken, accountTokenId: account._id, expiresAt: refreshExpiry() })
    return {
      message: 'OK',
      record: { _id: account.accountId, email: username, name: account.name, role: account.role, status: account.status, ...tokens }
    }
  }

  async refresh(body: Record<string, unknown>) {
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : ''
    if (!refreshToken) throw new BadRequestException('Refresh token is required')
    const stored = await this.refreshTokenModel.findOne({ token: refreshToken }).exec()
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException('Invalid or expired refresh token')
    const payload = this.jwtService.verify<TokenPayload>(refreshToken, { secret: this.jwtRefreshSecret() })
    const account = await this.accountTokenModel.findById(stored.accountTokenId).populate('role', 'name').populate('status', 'name').exec()
    if (!account) throw new NotFoundException('Account not found')
    const tokens = this.generateTokens({ userId: payload.userId, role: account.role as unknown as TokenPayload['role'], username: account.username })
    await this.refreshTokenModel.findByIdAndUpdate(stored._id, { token: tokens.refreshToken, expiresAt: refreshExpiry() }).exec()
    return {
      message: 'OK',
      record: { _id: account.accountId, email: account.username, name: account.name, role: account.role, status: account.status, ...tokens }
    }
  }

  verify(payload?: TokenPayload) {
    return { valid: true, record: payload, message: 'OK' }
  }

  async changePassword(userId: string, body: Record<string, unknown>) {
    const account = await this.accountTokenModel.findOne({ accountId: userId }).exec()
    if (!account) throw new NotFoundException(`Not found account with id ${userId}`)
    if (!(await bcrypt.compare(String(body.currentPassword || ''), account.password))) throw new BadRequestException('Invalid password')
    const hashedPassword = await bcrypt.hash(String(body.newPassword || ''), 10)
    const [active, pending] = await Promise.all([
      this.accountStatusModel.findOne({ name: StatusAccount.ACTIVE }),
      this.accountStatusModel.findOne({ name: StatusAccount.PENDING_VERIFICATION })
    ])
    const statusUpdate = pending?._id?.toString() === account.status?.toString() ? { status: active?._id } : {}
    await this.accountTokenModel.findByIdAndUpdate(account._id, { password: hashedPassword, ...statusUpdate }).exec()
    return { message: 'Password updated successfully' }
  }

  listRoles(query: CrudListQuery) {
    return this.crud.list(this.accountRoleModel, query, { searchFields: ['name', 'description'] })
  }
  role(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.accountRoleModel, id, {}, includeDeleted)
  }
  createRole(body: Record<string, unknown>) {
    return this.crud.create(this.accountRoleModel, body)
  }
  updateRole(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.accountRoleModel, id, body, replace)
  }
  deleteRole(id: string) {
    return this.crud.softDelete(this.accountRoleModel, id)
  }
  restoreRole(id: string) {
    return this.crud.restore(this.accountRoleModel, id)
  }
  listStatuses(query: CrudListQuery) {
    return this.crud.list(this.accountStatusModel, query, { searchFields: ['name', 'description'] })
  }
  status(id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.accountStatusModel, id, {}, includeDeleted)
  }
  createStatus(body: Record<string, unknown>) {
    return this.crud.create(this.accountStatusModel, body)
  }
  updateStatus(id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.accountStatusModel, id, body, replace)
  }
  deleteStatus(id: string) {
    return this.crud.softDelete(this.accountStatusModel, id)
  }
  restoreStatus(id: string) {
    return this.crud.restore(this.accountStatusModel, id)
  }
}
