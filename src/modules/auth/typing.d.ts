interface Tokens {
  accessToken: string
  refreshToken: string
}

interface TokenPayload {
  role: { _id: import('mongoose').Types.ObjectId; name: import('enums/common').RoleAccount }
  userId: import('mongoose').Types.ObjectId
  username: string
}

type TokenVerifiedRequest = import('express').Request & {
  tokenVerified?: TokenPayload
  requestId?: string
}

interface IRefreshToken {
  accountTokenId: import('mongoose').Types.ObjectId
  token: string
  expiresAt: Date
}

interface IAccountToken {
  accountId: import('mongoose').Types.ObjectId
  role: import('mongoose').Types.ObjectId
  status: import('mongoose').Types.ObjectId
  name: string
  username: string
  password: string
  fcmToken: string
}
