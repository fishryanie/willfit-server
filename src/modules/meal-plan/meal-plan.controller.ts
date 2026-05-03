import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { MealPlanBody } from 'modules/shared/swagger-body'
import { MealPlanService } from './meal-plan.service'

@Controller('api/meal-plans')
export class MealPlanController {
  constructor(@Inject(MealPlanService) private readonly mealPlanService: MealPlanService) {}

  @Get()
  list(@Query() query: CrudListQuery) {
    return this.mealPlanService.list(query)
  }

  @Post()
  @MealPlanBody()
  create(@Body() body: Record<string, unknown>) {
    return this.mealPlanService.create(body)
  }

  @Get('deleted')
  listDeleted(@Query() query: CrudListQuery) {
    return this.mealPlanService.list({ ...query, onlyDeleted: true })
  }

  @Get(':id')
  getById(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.mealPlanService.getById(id, includeDeleted === 'true')
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.mealPlanService.duplicate(id)
  }

  @Put(':id')
  @MealPlanBody()
  replace(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.mealPlanService.update(id, body, true)
  }

  @Patch(':id')
  @MealPlanBody()
  patch(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.mealPlanService.update(id, body)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mealPlanService.delete(id)
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.mealPlanService.restore(id)
  }
}
