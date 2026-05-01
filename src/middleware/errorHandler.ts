import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'

export class AppError extends Error {
  statusCode: number
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

export const asyncHandler = <T extends RequestHandler>(handler: T): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(StatusCodes.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`))
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = (req as Request & { requestId?: string }).requestId
  const isProduction = process.env.NODE_ENV === 'production'

  let statusCode = error instanceof AppError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR
  let message = error instanceof Error ? error.message : ReasonPhrases.INTERNAL_SERVER_ERROR
  let details = error instanceof AppError ? error.details : undefined

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = StatusCodes.BAD_REQUEST
    message = error.message
    details = error.errors
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = StatusCodes.BAD_REQUEST
    message = `Invalid ${error.path}`
  }

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    console.error('Unhandled request error', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      error
    })
  }

  res.status(statusCode).send({
    code: statusCode,
    message: isProduction && statusCode >= StatusCodes.INTERNAL_SERVER_ERROR ? ReasonPhrases.INTERNAL_SERVER_ERROR : message,
    requestId,
    ...(details && !isProduction ? { details } : {})
  })
}
