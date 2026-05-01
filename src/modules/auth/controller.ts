import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { EXPIRES_REFRESH_TOKEN, EXPIRES_TOKEN } from 'constants/token'
import { accountTokenModel, refreshTokenModel } from 'models'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { StatusAccount } from 'enums/common'
import { accountStatusModel } from './models'
import { isExpoPushToken } from 'modules/notifications/sendNotify'

type PushTokenRequestBody = {
  fcmToken?: unknown
  pushToken?: unknown
  expoPushToken?: unknown
}

const extractPushToken = (body: PushTokenRequestBody): string | undefined => {
  const candidates = [body.expoPushToken, body.pushToken, body.fcmToken]
  for (const candidate of candidates) {
    if (candidate === null) {
      return ''
    }
    if (typeof candidate === 'string') {
      return candidate.trim()
    }
  }
  return undefined
}

const jwtSecret = () => process.env.JWT_SECRET || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2'
const jwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'bAxsR8BVfj60DWXHE3u30oHzfl4G7khkSuPW'

export const generateTokens = (tokenPayload: TokenPayload): Tokens => {
  return {
    accessToken: jwt.sign(tokenPayload, jwtSecret(), { expiresIn: EXPIRES_TOKEN }),
    refreshToken: jwt.sign(tokenPayload, jwtRefreshSecret(), {
      expiresIn: EXPIRES_REFRESH_TOKEN
    })
  }
}

const getRefreshTokenExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

export const login = async (req: Request, res: Response) => {
  // #swagger.tags = ['Auth']
  try {
    const { username, password } = req.body
    const pushToken = extractPushToken((req.body ?? {}) as PushTokenRequestBody)
    const ACCOUNT = await accountTokenModel
      .findOne({ username })
      .populate('role', 'name')
      .populate('status', 'name')
      .select('-__v')
      .exec()
    if (!ACCOUNT || !(await bcrypt.compare(password, ACCOUNT['password']))) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid username or password' })
      return
    }
    if (typeof pushToken === 'string' && pushToken !== ACCOUNT.fcmToken) {
      if (!pushToken || isExpoPushToken(pushToken)) {
        ACCOUNT.fcmToken = pushToken
        await ACCOUNT.save()
      } else {
        console.warn('Skip storing invalid Expo push token on login:', pushToken)
      }
    }
    const role = ACCOUNT.role as unknown as TokenPayload['role']
    const { accessToken, refreshToken } = generateTokens({
      userId: ACCOUNT.accountId,
      role,
      username: ACCOUNT.username
    })
    await refreshTokenModel.create({ token: refreshToken, accountTokenId: ACCOUNT['_id'], expiresAt: getRefreshTokenExpiry() })
    res.status(StatusCodes.OK).send({
      message: ReasonPhrases.OK,
      record: {
        _id: ACCOUNT.accountId,
        email: username,
        name: ACCOUNT.name,
        role: ACCOUNT.role,
        status: ACCOUNT.status,
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}

export const refresh = async (req: Request, res: Response) => {
  // #swagger.tags = ['Auth']
  try {
    const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : ''
    if (!refreshToken) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Refresh token is required' })
      return
    }

    const storedRefreshToken = await refreshTokenModel.findOne({ token: refreshToken }).exec()
    if (!storedRefreshToken || storedRefreshToken.expiresAt < new Date()) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: 'Invalid or expired refresh token' })
      return
    }

    const payload = jwt.verify(refreshToken, jwtRefreshSecret()) as TokenPayload
    const account = await accountTokenModel.findById(storedRefreshToken.accountTokenId).populate('role', 'name').populate('status', 'name').exec()
    if (!account) {
      res.status(StatusCodes.NOT_FOUND).send({ message: 'Account not found' })
      return
    }

    const role = account.role as unknown as TokenPayload['role']
    const tokens = generateTokens({
      userId: payload.userId,
      role,
      username: account.username
    })

    await refreshTokenModel.findByIdAndUpdate(storedRefreshToken._id, { token: tokens.refreshToken, expiresAt: getRefreshTokenExpiry() }).exec()

    res.status(StatusCodes.OK).send({
      message: ReasonPhrases.OK,
      record: {
        _id: account.accountId,
        email: account.username,
        name: account.name,
        role: account.role,
        status: account.status,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: 'Invalid or expired refresh token' })
      return
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: ReasonPhrases.INTERNAL_SERVER_ERROR })
  }
}

export const verify = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Auth']
  res.status(StatusCodes.OK).send({ valid: true, record: req.tokenVerified, message: ReasonPhrases.OK })
}

export const changePassword = async (req: TokenVerifiedRequest, res: Response) => {
  // #swagger.tags = ['Auth']
  try {
    if (!req.tokenVerified?.userId) {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: ReasonPhrases.UNAUTHORIZED })
      return
    }
    const { currentPassword, newPassword } = req.body
    const Account = await accountTokenModel.findOne({ accountId: req.tokenVerified.userId })
    if (!Account) {
      res.status(StatusCodes.NOT_FOUND).send({
        code: StatusCodes.NOT_FOUND,
        message: `Not found client with id ${req.tokenVerified.userId}`
      })
      return
    }
    if (!(await bcrypt.compare(currentPassword, Account['password']))) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid password' })
      return
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const [STATUS_ACTIVE, STATUS_PENDING] = await Promise.all([
      accountStatusModel.findOne({ name: StatusAccount.ACTIVE }),
      accountStatusModel.findOne({ name: StatusAccount.PENDING_VERIFICATION })
    ])
    if (STATUS_PENDING?.['_id'] === Account['status']) {
      await accountTokenModel.findOneAndUpdate(
        { _id: Account['_id'] },
        { password: hashedPassword, status: STATUS_ACTIVE?.['_id'] },
        { new: true }
      )
    } else {
      await accountTokenModel.findByIdAndUpdate(Account['_id'], { password: hashedPassword }, { new: true })
    }
    res.status(StatusCodes.OK).send({ message: 'Password updated successfully' })
  } catch (error) {
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}
