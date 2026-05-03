import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/mongoose'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { EXPIRES_REFRESH_TOKEN, EXPIRES_TOKEN } from 'constants/token'
import { RoleAccount, StatusAccount } from 'enums/common'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { isExpoPushToken } from 'modules/notifications/push/send-notify'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'
import { Types, type Model } from 'mongoose'

const refreshExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const googleOAuthClient = new OAuth2Client()
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

const extractPushToken = (body: Record<string, unknown>) => {
  for (const key of ['expoPushToken', 'pushToken', 'fcmToken']) {
    const value = body[key]
    if (value === null) return ''
    if (typeof value === 'string') return value.trim()
  }
  return undefined
}

const optionalString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

const asObject = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined)

const socialPayload = (body: Record<string, unknown>) => asObject(body.data) || body

const extractIdentityToken = (body: Record<string, unknown>) => {
  const payload = socialPayload(body)
  return optionalString(payload.idToken) || optionalString(payload.identityToken) || optionalString(payload.token)
}

const extractProviderEmail = (body: Record<string, unknown>) => {
  const payload = socialPayload(body)
  const user = asObject(payload.user) || asObject(body.user)
  return optionalString(payload.email) || optionalString(payload.userEmail) || optionalString(user?.email)
}

const extractProviderName = (body: Record<string, unknown>) => {
  const payload = socialPayload(body)
  const user = asObject(payload.user) || asObject(body.user)
  const directName = optionalString(payload.fullName) || optionalString(payload.name) || optionalString(payload.displayName) || optionalString(user?.name)
  if (directName) return directName

  const fullName = payload.fullName || user
  if (fullName && typeof fullName === 'object') {
    const nameParts = ['givenName', 'middleName', 'familyName']
      .map((key) => optionalString((fullName as Record<string, unknown>)[key]))
      .filter(Boolean)
    if (nameParts.length > 0) return nameParts.join(' ')
  }

  return undefined
}

type SocialProfile = {
  provider: 'google' | 'apple'
  subject: string
  email?: string
  name?: string
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
    @InjectModel(MODEL_NAMES.refreshToken) private readonly refreshTokenModel: Model<IRefreshToken>,
    @InjectModel(MODEL_NAMES.user) private readonly userModel: Model<IUser>,
    @InjectModel(MODEL_NAMES.client) private readonly clientModel: Model<IClient>
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

  private socialConfig(provider: SocialProfile['provider']) {
    return this.configService.get<string[]>(`app.socialAuth.${provider === 'google' ? 'googleClientIds' : 'appleClientIds'}`) ?? []
  }

  private async ensureDefinition(model: Model<IDefinitionCommon>, name: RoleAccount | StatusAccount) {
    return model.findOneAndUpdate({ name }, { $setOnInsert: { name, deletedAt: null } }, { new: true, upsert: true, setDefaultsOnInsert: true }).exec()
  }

  private async issueAccountTokens(accountId: Types.ObjectId, username: string, role: TokenPayload['role'], accountTokenId: Types.ObjectId) {
    const tokens = this.generateTokens({ userId: accountId, role, username })
    await this.refreshTokenModel.create({ token: tokens.refreshToken, accountTokenId, expiresAt: refreshExpiry() })
    return tokens
  }

  private async updatePushToken(account: IAccountToken & { save: () => Promise<unknown> }, body: Record<string, unknown>) {
    const pushToken = extractPushToken(body)
    if (typeof pushToken === 'string' && pushToken !== account.fcmToken) {
      if (!pushToken || isExpoPushToken(pushToken)) {
        account.fcmToken = pushToken
        await account.save()
      }
    }
  }

  async login(body: Record<string, unknown>) {
    const username = typeof body.username === 'string' ? body.username : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const account = await this.accountTokenModel.findOne({ username }).populate('role', 'name').populate('status', 'name').select('-__v').exec()
    if (!account || !(await bcrypt.compare(password, account.password))) throw new BadRequestException('Invalid username or password')

    await this.updatePushToken(account as any, body)

    const role = account.role as unknown as TokenPayload['role']
    const tokens = await this.issueAccountTokens(account.accountId, account.username, role, account._id as Types.ObjectId)
    return {
      message: 'OK',
      record: { _id: account.accountId, email: username, name: account.name, role: account.role, status: account.status, ...tokens }
    }
  }

  async loginGoogle(body: Record<string, unknown>) {
    const idToken = extractIdentityToken(body)
    if (!idToken) throw new BadRequestException('Google idToken is required')

    const clientIds = this.socialConfig('google')
    if (clientIds.length === 0) throw new BadRequestException('GOOGLE_CLIENT_IDS is not configured')

    const ticket = await googleOAuthClient.verifyIdToken({ idToken, audience: clientIds })
    const payload = ticket.getPayload()
    if (!payload?.sub) throw new UnauthorizedException('Invalid Google token')
    if (payload.email_verified === false) throw new UnauthorizedException('Google email is not verified')

    return this.loginSocial(
      {
        provider: 'google',
        subject: payload.sub,
        email: payload.email,
        name: payload.name || extractProviderName(body)
      },
      body
    )
  }

  async loginApple(body: Record<string, unknown>) {
    const idToken = extractIdentityToken(body)
    if (!idToken) throw new BadRequestException('Apple identityToken is required')

    const clientIds = this.socialConfig('apple')
    if (clientIds.length === 0) throw new BadRequestException('APPLE_CLIENT_IDS or APPLE_BUNDLE_ID is not configured')

    const { payload } = await jwtVerify(idToken, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: clientIds
    })
    if (typeof payload.sub !== 'string') throw new UnauthorizedException('Invalid Apple token')
    if (payload.email_verified === false || payload.email_verified === 'false') throw new UnauthorizedException('Apple email is not verified')

    return this.loginSocial(
      {
        provider: 'apple',
        subject: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : extractProviderEmail(body),
        name: extractProviderName(body)
      },
      body
    )
  }

  private async loginSocial(profile: SocialProfile, body: Record<string, unknown>) {
    const username = profile.email || `${profile.provider}:${profile.subject}`
    const name = extractProviderName(body) || profile.name || profile.email || profile.provider
    let isNewUser = false
    let account = await this.accountTokenModel
      .findOne({
        $or: [{ authProvider: profile.provider, providerSubject: profile.subject }, { username }]
      })
      .populate('role', 'name')
      .populate('status', 'name')
      .exec()

    if (!account) {
      isNewUser = true
      const [role, status] = await Promise.all([
        this.ensureDefinition(this.accountRoleModel, RoleAccount.CLIENT),
        this.ensureDefinition(this.accountStatusModel, StatusAccount.ACTIVE)
      ])
      const user = await this.userModel.create({
        fullName: name,
        phone: optionalString(body.phone) || '',
        gender: 0
      })
      const client = await this.clientModel.create({
        email: profile.email || '',
        userInfo: user._id,
        trainer: [],
        medicalConditions: []
      })
      const createdAccount = await this.accountTokenModel.create({
        accountId: client._id,
        name,
        username,
        password: await bcrypt.hash(`${profile.provider}:${profile.subject}:${Date.now()}`, 10),
        status: status._id,
        role: role._id,
        authProvider: profile.provider,
        providerSubject: profile.subject
      })
      await createdAccount.populate('role', 'name')
      await createdAccount.populate('status', 'name')
      account = createdAccount
    } else {
      account.authProvider = profile.provider
      account.providerSubject = profile.subject
      if (profile.email && account.username.startsWith(`${profile.provider}:`)) account.username = profile.email
      if (name && !account.name) account.name = name
      await this.updatePushToken(account as any, body)
      await account.save()
    }

    if (!account) throw new UnauthorizedException('Cannot create social account')
    await this.updatePushToken(account as any, body)
    const tokens = await this.issueAccountTokens(
      account.accountId,
      account.username,
      account.role as unknown as TokenPayload['role'],
      account._id as Types.ObjectId
    )
    return {
      message: 'OK',
      record: {
        _id: account.accountId,
        email: profile.email || account.username,
        name: account.name,
        role: account.role,
        status: account.status,
        isNewUser,
        ...tokens
      }
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
