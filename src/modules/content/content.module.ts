import { Module } from '@nestjs/common'
import { SharedNestModule } from 'modules/shared/common.module'
import { AssessmentController } from './assessment.controller'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'

@Module({ imports: [SharedNestModule], controllers: [ContentController, AssessmentController], providers: [ContentService] })
export class ContentModule {}
