import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { JwtAuthGuard } from 'modules/shared/auth.guard'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { AccountBody } from 'modules/shared/swagger-body'
import { AccountsService } from './accounts.service'

const currentUser = (req: Request) => (req as TokenVerifiedRequest).tokenVerified

@ApiTags('Accounts')
@Controller('api')
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Get('client') @ApiBearerAuth() @UseGuards(JwtAuthGuard) clients(@Query() q: CrudListQuery) {
    return this.accounts.listClients(q)
  }
  @Get('client/deleted') @ApiBearerAuth() @UseGuards(JwtAuthGuard) deletedClients(@Query() q: CrudListQuery) {
    return this.accounts.listClients({ ...q, onlyDeleted: true })
  }
  @Post('client') @ApiBearerAuth() @AccountBody() @UseGuards(JwtAuthGuard) createClient(@Req() req: Request, @Body() b: Record<string, unknown>) {
    return this.accounts.createClient(b, currentUser(req)?.userId?.toString())
  }
  @Get('client/profile') @ApiBearerAuth() @UseGuards(JwtAuthGuard) profile(@Req() req: Request) {
    return this.accounts.client(currentUser(req)?.userId?.toString() || '', true)
  }
  @Get('client/:id') client(@Param('id') id: string, @Query('includeDeleted') d?: string) {
    return this.accounts.client(id, d === 'true')
  }
  @Put('client/:id') @AccountBody() replaceClient(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.accounts.updateClient(id, b, true)
  }
  @Patch('client/:id') @AccountBody() patchClient(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.accounts.updateClient(id, b)
  }
  @Delete('client/:id') deleteClient(@Param('id') id: string) {
    return this.accounts.deleteClient(id)
  }
  @Patch('client/:id/restore') restoreClient(@Param('id') id: string) {
    return this.accounts.restoreClient(id)
  }

  @Get('trainer') trainers(@Query() q: CrudListQuery) {
    return this.accounts.listTrainers(q)
  }
  @Get('trainer/deleted') deletedTrainers(@Query() q: CrudListQuery) {
    return this.accounts.listTrainers({ ...q, onlyDeleted: true })
  }
  @Post('trainer') @AccountBody() createTrainer(@Body() b: Record<string, unknown>) {
    return this.accounts.createTrainer(b)
  }
  @Get('trainer/:id') trainer(@Param('id') id: string, @Query('includeDeleted') d?: string) {
    return this.accounts.trainer(id, d === 'true')
  }
  @Put('trainer/:id') @AccountBody() replaceTrainer(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.accounts.updateTrainer(id, b, true)
  }
  @Patch('trainer/:id') @AccountBody() patchTrainer(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.accounts.updateTrainer(id, b)
  }
  @Delete('trainer/:id') deleteTrainer(@Param('id') id: string) {
    return this.accounts.deleteTrainer(id)
  }
  @Patch('trainer/:id/restore') restoreTrainer(@Param('id') id: string) {
    return this.accounts.restoreTrainer(id)
  }

  @Get('user/admin') admins(@Query() q: CrudListQuery) {
    return this.accounts.listAdmins(q)
  }
  @Get('user/admin/deleted') deletedAdmins(@Query() q: CrudListQuery) {
    return this.accounts.listAdmins({ ...q, onlyDeleted: true })
  }
  @Post('user/admin') @AccountBody() createAdmin(@Body() b: Record<string, unknown>) {
    return this.accounts.createAdmin(b)
  }
  @Get('user/admin/:id') admin(@Param('id') id: string, @Query('includeDeleted') d?: string) {
    return this.accounts.admin(id, d === 'true')
  }
  @Patch('user/admin/:id') @AccountBody() patchAdmin(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.accounts.updateAdmin(id, b)
  }
  @Delete('user/admin/:id') deleteAdmin(@Param('id') id: string) {
    return this.accounts.deleteAdmin(id)
  }
  @Patch('user/admin/:id/restore') restoreAdmin(@Param('id') id: string) {
    return this.accounts.restoreAdmin(id)
  }

  @Get('user/staff') staff(@Query() q: CrudListQuery) {
    return this.accounts.listStaff(q)
  }
  @Get('user/staff/deleted') deletedStaff(@Query() q: CrudListQuery) {
    return this.accounts.listStaff({ ...q, onlyDeleted: true })
  }
  @Post('user/staff') @AccountBody() createStaff(@Body() b: Record<string, unknown>) {
    return this.accounts.createStaff(b)
  }
  @Get('user/staff/:id') staffOne(@Param('id') id: string, @Query('includeDeleted') d?: string) {
    return this.accounts.staff(id, d === 'true')
  }
  @Patch('user/staff/:id') @AccountBody() patchStaff(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.accounts.updateStaff(id, b)
  }
  @Delete('user/staff/:id') deleteStaff(@Param('id') id: string) {
    return this.accounts.deleteStaff(id)
  }
  @Patch('user/staff/:id/restore') restoreStaff(@Param('id') id: string) {
    return this.accounts.restoreStaff(id)
  }
}
