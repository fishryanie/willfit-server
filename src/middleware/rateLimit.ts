import type { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

type RateLimitOptions = {
  windowMs: number
  max: number
  keyPrefix?: string
  message?: string
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const getClientIp = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

export const createRateLimiter = ({ windowMs, max, keyPrefix = 'global', message }: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = `${keyPrefix}:${getClientIp(req)}`
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    bucket.count += 1
    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000)
      res.setHeader('Retry-After', retryAfterSeconds.toString())
      res.status(StatusCodes.TOO_MANY_REQUESTS).send({
        code: StatusCodes.TOO_MANY_REQUESTS,
        message: message || 'Too many requests. Please slow down.',
        retryAfterSeconds
      })
      return
    }

    next()
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}, 60_000).unref()
