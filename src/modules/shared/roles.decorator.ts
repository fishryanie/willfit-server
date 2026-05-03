import { SetMetadata } from '@nestjs/common'
import type { RoleAccount } from 'enums/common'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: RoleAccount[]) => SetMetadata(ROLES_KEY, roles)
