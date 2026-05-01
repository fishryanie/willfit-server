import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { RoleAccount } from 'enums/common'
import lodash from 'lodash'

const extractTokenFromHeader = (req: Request): string | undefined => {
  const [type, token] = req.headers.authorization?.split(' ') ?? []
  return type === 'Bearer' ? token : undefined
}

export const verifyToken = (req: TokenVerifiedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req)
    if (!token) {
      res.status(StatusCodes.NOT_FOUND).send({ message: 'Access denied! no token provided.' })
      return
    }
    const verifiedPayload = jwt.verify(token, process.env.JWT_SECRET || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2')
    req['tokenVerified'] = verifiedPayload as TokenPayload
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(StatusCodes.UNAUTHORIZED).send({
        code: StatusCodes.UNAUTHORIZED,
        message: 'Access denied! Token has expired.'
      })
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(StatusCodes.BAD_REQUEST).send({ code: StatusCodes.BAD_REQUEST, message: error.message })
    } else if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
}

export const verifyRoleAccess = (roleName: 'Client' | 'Trainer' | RoleAccount[]) => {
  return async (req: TokenVerifiedRequest, res: Response, next: NextFunction) => {
    try {
      if (
        lodash.isArray(roleName) &&
        req.tokenVerified?.role.name &&
        !roleName.includes(req.tokenVerified?.role.name)
      ) {
        res.status(StatusCodes.FORBIDDEN).send({ code: StatusCodes.FORBIDDEN, message: ReasonPhrases.FORBIDDEN })
        return
      } else if (!lodash.isArray(roleName) && req.tokenVerified?.role.name !== roleName) {
        res.status(StatusCodes.FORBIDDEN).send({ code: StatusCodes.FORBIDDEN, message: ReasonPhrases.FORBIDDEN })
        return
      }
      return next()
    } catch (error) {
      if (error instanceof Error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
      }
    }
  }
}
