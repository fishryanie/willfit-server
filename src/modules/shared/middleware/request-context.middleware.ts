import type { NextFunction, Request, Response } from 'express'
import { Injectable } from '@nestjs/common'
import type { NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.header('x-request-id') || randomUUID()
    ;(req as Request & { requestId?: string }).requestId = requestId
    res.setHeader('x-request-id', requestId)
    next()
  }
}
