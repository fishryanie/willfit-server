import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ApiTags } from '@nestjs/swagger'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'
import { AssessmentBody } from 'modules/shared/swagger-body'
import type { Model } from 'mongoose'

@ApiTags('Assessment')
@Controller('api/assessment')
export class AssessmentController {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @InjectModel(MODEL_NAMES.assessment) private readonly assessmentModel: Model<any>
  ) {}

  @Get() list(@Query() q: CrudListQuery) {
    return this.crud.list(this.assessmentModel, q, { searchFields: ['name', 'description', 'level'] })
  }
  @Get('deleted') deleted(@Query() q: CrudListQuery) {
    return this.crud.list(this.assessmentModel, { ...q, onlyDeleted: true })
  }
  @Post() @AssessmentBody() create(@Body() b: Record<string, unknown>) {
    return this.crud.create(this.assessmentModel, b)
  }
  @Get(':id') get(@Param('id') id: string, @Query('includeDeleted') d?: string) {
    return this.crud.getById(this.assessmentModel, id, {}, d === 'true')
  }
  @Put(':id') @AssessmentBody() replace(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.crud.update(this.assessmentModel, id, b, true)
  }
  @Patch(':id') @AssessmentBody() patch(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.crud.update(this.assessmentModel, id, b)
  }
  @Delete(':id') delete(@Param('id') id: string) {
    return this.crud.softDelete(this.assessmentModel, id)
  }
  @Patch(':id/restore') restore(@Param('id') id: string) {
    return this.crud.restore(this.assessmentModel, id)
  }
}
