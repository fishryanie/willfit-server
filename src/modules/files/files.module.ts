import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { FilesController } from './files.controller'

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({ destination: 'data/' }),
        limits: {
          fileSize: configService.get<number>('app.upload.maxImageSize') ?? 5 * 1024 * 1024
        }
      })
    })
  ],
  controllers: [FilesController]
})
export class FilesModule {}
