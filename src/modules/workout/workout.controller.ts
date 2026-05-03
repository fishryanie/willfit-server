import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager'
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from 'modules/shared/auth.guard'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { WorkoutCatalogBody, WorkoutSessionBody } from 'modules/shared/swagger-body'
import { WorkoutService } from './workout.service'

type WorkoutResource = 'equipment' | 'muscles-categories' | 'exercise-goals' | 'exercise-level' | 'exercise-categories' | 'exercise' | 'muscles'

const catalogRoutes = ['equipment', 'muscles-categories', 'exercise-goals', 'exercise-level', 'exercise-categories', 'exercise', 'muscles']
const catalogDeletedRoutes = catalogRoutes.map((route) => `${route}/deleted`)
const catalogIdRoutes = catalogRoutes.map((route) => `${route}/:id`)
const catalogRestoreRoutes = catalogRoutes.map((route) => `${route}/:id/restore`)

const resourceFromRequest = (req: Request) => req.path.replace(/^\/api\//, '').split('/')[0] as WorkoutResource

@Controller('api')
export class WorkoutController {
  constructor(@Inject(WorkoutService) private readonly workoutService: WorkoutService) {}

  @Get(catalogRoutes)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  listCatalog(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.workoutService.listCatalog(resourceFromRequest(req), query)
  }

  @Post(catalogRoutes)
  @WorkoutCatalogBody()
  createCatalog(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.workoutService.createCatalog(resourceFromRequest(req), body)
  }

  @Get(catalogDeletedRoutes)
  listDeletedCatalog(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.workoutService.listCatalog(resourceFromRequest(req), { ...query, onlyDeleted: true })
  }

  @Get(catalogIdRoutes)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  getCatalog(@Req() req: Request, @Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.workoutService.getCatalogById(resourceFromRequest(req), id, includeDeleted === 'true')
  }

  @Put(catalogIdRoutes)
  @WorkoutCatalogBody()
  replaceCatalog(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.workoutService.updateCatalog(resourceFromRequest(req), id, body, true)
  }

  @Patch(catalogIdRoutes)
  @WorkoutCatalogBody()
  patchCatalog(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.workoutService.updateCatalog(resourceFromRequest(req), id, body)
  }

  @Delete(catalogIdRoutes)
  deleteCatalog(@Req() req: Request, @Param('id') id: string) {
    return this.workoutService.deleteCatalog(resourceFromRequest(req), id)
  }

  @Patch(catalogRestoreRoutes)
  restoreCatalog(@Req() req: Request, @Param('id') id: string) {
    return this.workoutService.restoreCatalog(resourceFromRequest(req), id)
  }

  @Get('workout-session')
  listSessions(@Query() query: CrudListQuery) {
    return this.workoutService.listSessions(query)
  }

  @Post('workout-session')
  @WorkoutSessionBody()
  createSession(@Body() body: Record<string, unknown>) {
    return this.workoutService.createSession(body)
  }

  @Get('workout-session/deleted')
  listDeletedSessions(@Query() query: CrudListQuery) {
    return this.workoutService.listSessions({ ...query, onlyDeleted: true })
  }

  @Get('workout-session/client')
  @UseGuards(JwtAuthGuard)
  getSessionsForClient(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.workoutService.getSessionsForCurrentClient((req as TokenVerifiedRequest).tokenVerified?.userId?.toString(), query)
  }

  @Get('workout-session/:id')
  getSession(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.workoutService.getSessionById(id, includeDeleted === 'true')
  }

  @Put('workout-session/:id')
  @WorkoutSessionBody()
  replaceSession(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.workoutService.updateSession(id, body, true)
  }

  @Patch('workout-session/:id')
  @WorkoutSessionBody()
  patchSession(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.workoutService.updateSession(id, body)
  }

  @Delete('workout-session/:id')
  deleteSession(@Param('id') id: string) {
    return this.workoutService.deleteSession(id)
  }

  @Patch('workout-session/:id/restore')
  restoreSession(@Param('id') id: string) {
    return this.workoutService.restoreSession(id)
  }
}
