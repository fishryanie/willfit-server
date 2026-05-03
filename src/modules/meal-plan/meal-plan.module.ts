import { Module } from '@nestjs/common'
import { SharedNestModule } from 'modules/shared/common.module'
import { MealPlanController } from './meal-plan.controller'
import { MealPlanService } from './meal-plan.service'

@Module({
  imports: [SharedNestModule],
  controllers: [MealPlanController],
  providers: [MealPlanService]
})
export class MealPlanModule {}
