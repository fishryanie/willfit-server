const splitCsv = (value?: string) => {
  return value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const getEnvNumber = (key: string, fallback: number) => {
  const parsed = Number(process.env[key])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const getEnvBoolean = (key: string, fallback = false) => {
  const value = process.env[key]
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

export const getCorsOrigins = () => {
  return splitCsv(process.env.CORS_ORIGINS || process.env.API_URL_PRO) || ['http://localhost:3000', 'http://localhost:5173']
}

export const getBodyLimit = () => process.env.BODY_LIMIT || '10mb'

export const getPort = () => process.env.PORT || '3000'

export const assertRuntimeConfig = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env')
  }

  if (process.env.NODE_ENV === 'production') {
    const missing = [
      ['JWT_SECRET', process.env.JWT_SECRET],
      ['JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET],
      ['CORS_ORIGINS', process.env.CORS_ORIGINS || process.env.API_URL_PRO]
    ].filter(([, value]) => !value)

    if (missing.length > 0) {
      throw new Error(`Missing required production env vars: ${missing.map(([name]) => name).join(', ')}`)
    }
  }
}
