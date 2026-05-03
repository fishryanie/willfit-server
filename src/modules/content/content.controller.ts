import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { ContentBody } from 'modules/shared/swagger-body'
import { ContentService, type ContentResource } from './content.service'

const routes = ['plan', 'states', 'schedule', 'guide', 'news', 'course', 'article-categories', 'article', 'contact']
const deletedRoutes = routes.map((route) => `${route}/deleted`)
const idRoutes = routes.map((route) => `${route}/:id`)
const restoreRoutes = routes.map((route) => `${route}/:id/restore`)
const resourceFromRequest = (req: Request) => req.path.replace(/^\/api\/common\//, '').split('/')[0] as ContentResource

@ApiTags('Common')
@Controller('api/common')
export class ContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get(routes) list(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.contentService.list(resourceFromRequest(req), query)
  }
  @Get(deletedRoutes) deleted(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.contentService.list(resourceFromRequest(req), { ...query, onlyDeleted: true })
  }
  @Get(idRoutes) get(@Req() req: Request, @Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.contentService.get(resourceFromRequest(req), id, includeDeleted === 'true')
  }
  @Post(routes) @ContentBody() create(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.contentService.create(resourceFromRequest(req), body)
  }
  @Put(idRoutes) @ContentBody() replace(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contentService.update(resourceFromRequest(req), id, body, true)
  }
  @Patch(idRoutes) @ContentBody() patch(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contentService.update(resourceFromRequest(req), id, body)
  }
  @Delete(idRoutes) delete(@Req() req: Request, @Param('id') id: string) {
    return this.contentService.delete(resourceFromRequest(req), id)
  }
  @Patch(restoreRoutes) restore(@Req() req: Request, @Param('id') id: string) {
    return this.contentService.restore(resourceFromRequest(req), id)
  }
}
