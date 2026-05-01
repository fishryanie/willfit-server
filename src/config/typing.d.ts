declare namespace NodeJS {
  interface ProcessEnv {
    API_URL_PRO?: string
    AUTH_RATE_LIMIT_MAX?: string
    AUTH_RATE_LIMIT_WINDOW_MS?: string
    BODY_LIMIT?: string
    CLOUDINARY_API_KEY?: string
    CLOUDINARY_API_SECRET?: string
    CLOUDINARY_CLOUD_NAME?: string
    CORS_ORIGINS?: string
    EXPO_ACCESS_TOKEN?: string
    JWT_REFRESH_SECRET?: string
    JWT_SECRET?: string
    MONGODB_DB?: string
    MONGODB_URI?: string
    NODE_ENV?: 'development' | 'production' | 'test'
    PORT?: string
    RATE_LIMIT_MAX?: string
    RATE_LIMIT_WINDOW_MS?: string
  }
}
