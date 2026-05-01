import * as express from 'express'
import { baseRESTful } from 'utils/helpers'
import { accountRoleModel, accountStatusModel } from './models'
import { changePassword, login, refresh, verify } from './controller'
import { createRateLimiter } from 'middleware/rateLimit'
import { getEnvNumber } from 'config/env'
import { verifyToken } from 'middleware/auth'

const router = express.Router()

router.post(
  '/login',
  createRateLimiter({
    windowMs: getEnvNumber('AUTH_RATE_LIMIT_WINDOW_MS', 60_000),
    max: getEnvNumber('AUTH_RATE_LIMIT_MAX', 20),
    keyPrefix: 'auth-login',
    message: 'Too many login attempts. Please try again later.'
  }),
  login
)
router.post('/refresh', refresh)
router.get('/verify', verifyToken, verify)
router.patch('/change-password', verifyToken, changePassword)
baseRESTful('/account-roles', router, accountRoleModel)
baseRESTful('/account-status', router, accountStatusModel)

export default router
