import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') || randomUUID()
  ;(req as Request & { requestId?: string }).requestId = requestId
  res.setHeader('x-request-id', requestId)
  next()
}
