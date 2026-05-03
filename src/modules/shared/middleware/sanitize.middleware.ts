import type { NextFunction, Request, Response } from 'express'
import { Injectable } from '@nestjs/common'
import type { NestMiddleware } from '@nestjs/common'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (!isPlainObject(value)) {
    return value
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue
    }
    sanitized[key] = sanitizeValue(nestedValue)
  }
  return sanitized
}

const sanitizeObjectInPlace = (value: unknown) => {
  if (!isPlainObject(value)) return

  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key]
      continue
    }
    value[key] = sanitizeValue(value[key])
  }
}

@Injectable()
export class SanitizeNoSqlInputMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    req.body = sanitizeValue(req.body)
    sanitizeObjectInPlace(req.query)
    sanitizeObjectInPlace(req.params)
    next()
  }
}
