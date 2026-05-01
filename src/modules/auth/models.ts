import { SCHEMA_COMMON } from 'constants/schema'
import { accountTokenSchema } from './schema/accountCredential'
import { refreshTokenSchema } from './schema/refreshToken'
import { model } from 'mongoose'

export const accountRoleModel = model<IDefinitionCommon>('account_role', SCHEMA_COMMON)
export const accountStatusModel = model<IDefinitionCommon>('account_status', SCHEMA_COMMON)
export const accountTokenModel = model<IAccountToken>('account_token', accountTokenSchema)
export const refreshTokenModel = model<IRefreshToken>('refresh_token', refreshTokenSchema)
