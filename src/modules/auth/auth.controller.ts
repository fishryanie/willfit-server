import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { JwtAuthGuard } from 'modules/shared/auth.guard'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { AuthLoginBody, ChangePasswordBody, LookupBody, RefreshTokenBody } from 'modules/shared/swagger-body'
import { AuthService } from './auth.service'

const userId = (req: Request) => (req as TokenVerifiedRequest).tokenVerified?.userId?.toString() || ''

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @AuthLoginBody()
  login(@Body() body: Record<string, unknown>) {
    return this.authService.login(body)
  }
  @Post('refresh')
  @RefreshTokenBody()
  refresh(@Body() body: Record<string, unknown>) {
    return this.authService.refresh(body)
  }

  @Get('verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  verify(@Req() req: Request) {
    return this.authService.verify((req as TokenVerifiedRequest).tokenVerified)
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @ChangePasswordBody()
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.authService.changePassword(userId(req), body)
  }

  @Get('account-roles') listRoles(@Query() query: CrudListQuery) {
    return this.authService.listRoles(query)
  }
  @Get('account-roles/deleted') deletedRoles(@Query() query: CrudListQuery) {
    return this.authService.listRoles({ ...query, onlyDeleted: true })
  }
  @Get('account-roles/:id') role(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.authService.role(id, includeDeleted === 'true')
  }
  @Post('account-roles')
  @LookupBody()
  createRole(@Body() body: Record<string, unknown>) {
    return this.authService.createRole(body)
  }
  @Put('account-roles/:id')
  @LookupBody()
  replaceRole(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.authService.updateRole(id, body, true)
  }
  @Patch('account-roles/:id')
  @LookupBody()
  patchRole(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.authService.updateRole(id, body)
  }
  @Delete('account-roles/:id') deleteRole(@Param('id') id: string) {
    return this.authService.deleteRole(id)
  }
  @Patch('account-roles/:id/restore') restoreRole(@Param('id') id: string) {
    return this.authService.restoreRole(id)
  }

  @Get('account-status') listStatuses(@Query() query: CrudListQuery) {
    return this.authService.listStatuses(query)
  }
  @Get('account-status/deleted') deletedStatuses(@Query() query: CrudListQuery) {
    return this.authService.listStatuses({ ...query, onlyDeleted: true })
  }
  @Get('account-status/:id') status(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.authService.status(id, includeDeleted === 'true')
  }
  @Post('account-status')
  @LookupBody()
  createStatus(@Body() body: Record<string, unknown>) {
    return this.authService.createStatus(body)
  }
  @Put('account-status/:id')
  @LookupBody()
  replaceStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.authService.updateStatus(id, body, true)
  }
  @Patch('account-status/:id')
  @LookupBody()
  patchStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.authService.updateStatus(id, body)
  }
  @Delete('account-status/:id') deleteStatus(@Param('id') id: string) {
    return this.authService.deleteStatus(id)
  }
  @Patch('account-status/:id/restore') restoreStatus(@Param('id') id: string) {
    return this.authService.restoreStatus(id)
  }
}
