import path from 'path'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import responseTime from 'response-time'
import swaggerUi from 'swagger-ui-express'
import mongooseConnection from 'utils/mongooseConnection'
import { assertRuntimeConfig, getBodyLimit, getCorsOrigins, getEnvNumber, getPort } from 'config/env'
import { app, server } from 'utils/server'
import useRoutes from 'api/router'
import swaggerFile from '../swagger.json'
import { requestContext } from 'middleware/requestContext'
import { securityHeaders } from 'middleware/security'
import { createRateLimiter } from 'middleware/rateLimit'
import { sanitizeNoSqlInput } from 'middleware/sanitize'
import { errorHandler, notFoundHandler } from 'middleware/errorHandler'
import { admin, adminRouter } from 'modules/admin/router'

const __dirname = path.resolve()

assertRuntimeConfig()

const corsOrigins = getCorsOrigins()
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}

app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(requestContext)
app.use(responseTime())
app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(
  createRateLimiter({
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60_000),
    max: getEnvNumber('RATE_LIMIT_MAX', 600)
  })
)
app.use(admin.options.rootPath, adminRouter)
app.use(express.json({ limit: getBodyLimit() }))
app.use(express.urlencoded({ limit: getBodyLimit(), extended: true }))
app.use(sanitizeNoSqlInput)
app.use(morgan('combined'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use('/', useRoutes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile))
app.use(notFoundHandler)
app.use(errorHandler)

server.listen(getPort(), async () => {
  await mongooseConnection()
  console.log(`Server is running on port ${getPort()}.`)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error)
  process.exit(1)
})
