import { Module } from '@nestjs/common'
import { SharedNestModule } from 'modules/shared/common.module'
import { WorkoutController } from './workout.controller'
import { WorkoutService } from './workout.service'

@Module({
  imports: [SharedNestModule],
  controllers: [WorkoutController],
  providers: [WorkoutService]
})
export class WorkoutModule {}
