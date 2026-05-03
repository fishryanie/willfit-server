import { registerAs } from '@nestjs/config'

const splitCsv = (value?: string) => {
  return value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const numberFromEnv = (key: string, fallback: number) => {
  const parsed = Number(process.env[key])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

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

export default registerAs('app', () => ({
  port: process.env.PORT || '3000',
  bodyLimit: process.env.BODY_LIMIT || '10mb',
  corsOrigins: splitCsv(process.env.CORS_ORIGINS || process.env.API_URL_PRO) || ['http://localhost:3000', 'http://localhost:5173'],
  mongo: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB,
    maxPoolSize: numberFromEnv('MONGODB_MAX_POOL_SIZE', 50),
    minPoolSize: numberFromEnv('MONGODB_MIN_POOL_SIZE', 2),
    serverSelectionTimeoutMS: numberFromEnv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', 10_000)
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET
  },
  socialAuth: {
    googleClientIds: splitCsv(process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID) || [],
    appleClientIds: splitCsv(process.env.APPLE_CLIENT_IDS || process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID) || []
  },
  cache: {
    ttl: numberFromEnv('CACHE_TTL_MS', 30_000),
    max: numberFromEnv('CACHE_MAX_ITEMS', 500)
  },
  rateLimit: {
    ttl: numberFromEnv('RATE_LIMIT_WINDOW_MS', 60_000),
    limit: numberFromEnv('RATE_LIMIT_MAX', 600)
  },
  upload: {
    maxImageSize: numberFromEnv('UPLOAD_MAX_IMAGE_SIZE_BYTES', 5 * 1024 * 1024)
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN,
    timeout: numberFromEnv('EXPO_HTTP_TIMEOUT_MS', 10_000)
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: numberFromEnv('REDIS_PORT', 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB || 0)
  }
}))
