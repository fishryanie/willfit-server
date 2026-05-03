import path from 'path'
import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getConnectionToken } from '@nestjs/mongoose'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import 'reflect-metadata'
import { assertRuntimeConfig } from 'config/app.config'
import { createAdminRouter } from 'modules/admin/admin.router'
import { AppModule } from 'modules/app.module'
import type { Connection } from 'mongoose'

const __dirname = path.resolve()
const logger = new Logger('Bootstrap')

assertRuntimeConfig()

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(ConfigService)
  const expressApp = app.getHttpAdapter().getInstance()
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? []
  const corsOptions = {
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  }

  app.enableCors(corsOptions)
  app.useBodyParser('json', { limit: configService.get<string>('app.bodyLimit') ?? '10mb' })
  app.useBodyParser('urlencoded', { limit: configService.get<string>('app.bodyLimit') ?? '10mb', extended: true })
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false
    })
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WillFit API')
    .setDescription('WillFit NestJS backend API')
    .setVersion('2.0.0')
    .setContact('Phanupong', 'https://www.willfit.co.th', 'https://www.willfit.co.th/')
    .addBearerAuth()
    .build()
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api-docs', app, swaggerDocument)

  expressApp.set('views', path.join(__dirname, 'views'))
  expressApp.set('view engine', 'ejs')
  expressApp.set('trust proxy', 1)
  expressApp.disable('x-powered-by')

  const { admin, adminRouter } = createAdminRouter(app.get<Connection>(getConnectionToken()))
  app.use(admin.options.rootPath, adminRouter)

  const port = configService.get<string>('app.port') ?? '3000'
  await app.listen(port)
  logger.log(`NestJS server is running on port ${port}.`)
}

void bootstrap()

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error)
  process.exit(1)
})
