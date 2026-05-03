import { Body, Controller, Delete, Get, Headers, Inject, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from 'modules/shared/auth.guard'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { NotificationBody, PushDeviceBody } from 'modules/shared/swagger-body'
import { NotificationsService } from './notifications.service'

const currentUserId = (req: Request) => (req as TokenVerifiedRequest).tokenVerified?.userId?.toString() || ''

@Controller('api/common')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @Post('push/register-device')
  @PushDeviceBody()
  registerDevice(@Body() body: Record<string, unknown>, @Headers('authorization') authorization?: string) {
    return this.notificationsService.registerDevice(body, authorization)
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  getInbox(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.notificationsService.getInbox(currentUserId(req), query)
  }

  @Get('notifications/deleted')
  @UseGuards(JwtAuthGuard)
  getDeletedInbox(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.notificationsService.getInbox(currentUserId(req), { ...query, onlyDeleted: true })
  }

  @Patch('notifications/read/:id')
  @UseGuards(JwtAuthGuard)
  markRead(@Req() req: Request, @Param('id') id: string) {
    return this.notificationsService.markRead(currentUserId(req), id)
  }

  @Delete('notifications/remove/:id')
  @UseGuards(JwtAuthGuard)
  removeFromInbox(@Req() req: Request, @Param('id') id: string) {
    return this.notificationsService.deleteFromInbox(currentUserId(req), id)
  }

  @Patch('notifications/restore/:id')
  @UseGuards(JwtAuthGuard)
  restoreInbox(@Req() req: Request, @Param('id') id: string) {
    return this.notificationsService.restoreInbox(currentUserId(req), id)
  }

  @Get('notifications/cms')
  @UseGuards(JwtAuthGuard)
  listCms(@Query() query: CrudListQuery) {
    return this.notificationsService.listCms(query)
  }

  @Post('notifications/cms')
  @UseGuards(JwtAuthGuard)
  @NotificationBody()
  createCms(@Body() body: Record<string, unknown>) {
    return this.notificationsService.createCms(body)
  }

  @Get('notifications/cms/deleted')
  @UseGuards(JwtAuthGuard)
  listDeletedCms(@Query() query: CrudListQuery) {
    return this.notificationsService.listCms({ ...query, onlyDeleted: true })
  }

  @Get('notifications/cms/:id')
  @UseGuards(JwtAuthGuard)
  getCms(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.notificationsService.getCms(id, includeDeleted === 'true')
  }

  @Put('notifications/cms/:id')
  @UseGuards(JwtAuthGuard)
  @NotificationBody()
  replaceCms(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notificationsService.updateCms(id, body, true)
  }

  @Patch('notifications/cms/:id')
  @UseGuards(JwtAuthGuard)
  @NotificationBody()
  patchCms(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notificationsService.updateCms(id, body)
  }

  @Delete('notifications/cms/:id')
  @UseGuards(JwtAuthGuard)
  deleteCms(@Param('id') id: string) {
    return this.notificationsService.deleteCms(id)
  }

  @Patch('notifications/cms/:id/restore')
  @UseGuards(JwtAuthGuard)
  restoreCms(@Param('id') id: string) {
    return this.notificationsService.restoreCms(id)
  }

  @Get('push/devices')
  @UseGuards(JwtAuthGuard)
  listDevices(@Query() query: CrudListQuery) {
    return this.notificationsService.listDevices(query)
  }

  @Get('push/devices/deleted')
  @UseGuards(JwtAuthGuard)
  listDeletedDevices(@Query() query: CrudListQuery) {
    return this.notificationsService.listDevices({ ...query, onlyDeleted: true })
  }

  @Patch('push/devices/:id')
  @UseGuards(JwtAuthGuard)
  @PushDeviceBody()
  patchDevice(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.notificationsService.updateDevice(id, body)
  }

  @Delete('push/devices/:id')
  @UseGuards(JwtAuthGuard)
  deleteDevice(@Param('id') id: string) {
    return this.notificationsService.deleteDevice(id)
  }
}
