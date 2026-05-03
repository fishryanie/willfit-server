import {
  Controller,
  Inject,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  FileTypeValidator
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import path from 'path'
import fs from 'fs/promises'
import { v2 as cloudinary } from 'cloudinary'
import { v7 as uuidV7 } from 'uuid'
import { UPLOAD_MAX_IMAGE_SIZE_BYTES } from 'constants/token'

@ApiTags('Files')
@Controller('api/cloud')
export class FilesController {
  private readonly logger = new Logger(FilesController.name)

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  @Post('upload/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: UPLOAD_MAX_IMAGE_SIZE_BYTES }), new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ })]
      })
    )
    file: Express.Multer.File
  ) {
    cloudinary.config({
      api_key: this.configService.get<string>('app.cloudinary.apiKey'),
      api_secret: this.configService.get<string>('app.cloudinary.apiSecret'),
      cloud_name: this.configService.get<string>('app.cloudinary.cloudName')
    })
    const originalName = path.parse(file.originalname).name
    const newFileName = `${originalName}-${uuidV7()}`
    try {
      await cloudinary.uploader.upload(file.path, { use_filename: true, public_id: newFileName })
      const url = cloudinary.url(newFileName, { transformation: [{ quality: 'auto', fetch_format: 'auto' }] })
      return { record: { fileId: newFileName, url }, message: 'Created' }
    } catch (error) {
      this.logger.error('Cloudinary upload failed', error)
      throw new InternalServerErrorException('Upload failed')
    } finally {
      await fs.unlink(file.path).catch(() => undefined)
    }
  }
}
