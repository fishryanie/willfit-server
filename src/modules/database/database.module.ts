import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { modelDefinitions } from './model-registry'

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.mongo.uri'),
        dbName: configService.get<string>('app.mongo.dbName'),
        maxPoolSize: configService.get<number>('app.mongo.maxPoolSize') ?? 50,
        minPoolSize: configService.get<number>('app.mongo.minPoolSize') ?? 2,
        serverSelectionTimeoutMS: configService.get<number>('app.mongo.serverSelectionTimeoutMS') ?? 10_000
      })
    }),
    MongooseModule.forFeature(modelDefinitions)
  ],
  exports: [MongooseModule]
})
export class DatabaseModule {}
