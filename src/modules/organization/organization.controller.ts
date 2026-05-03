import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { LookupBody, OrganizationBody } from 'modules/shared/swagger-body'
import { OrganizationService } from './organization.service'

@ApiTags('Organization')
@Controller('api/organization')
export class OrganizationController {
  constructor(@Inject(OrganizationService) private readonly organizationService: OrganizationService) {}

  @Get() list(@Query() q: CrudListQuery) {
    return this.organizationService.list(q)
  }
  @Get('deleted') deleted(@Query() q: CrudListQuery) {
    return this.organizationService.list({ ...q, onlyDeleted: true })
  }
  @Post() @OrganizationBody() create(@Body() b: Record<string, unknown>) {
    return this.organizationService.create(b)
  }

  @Get('categories') categories(@Query() q: CrudListQuery) {
    return this.organizationService.categories(q)
  }
  @Get('categories/deleted') deletedCategories(@Query() q: CrudListQuery) {
    return this.organizationService.categories({ ...q, onlyDeleted: true })
  }
  @Post('categories') @LookupBody() createCategory(@Body() b: Record<string, unknown>) {
    return this.organizationService.createCategory(b)
  }
  @Get('categories/:id') category(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.organizationService.category(id, includeDeleted === 'true')
  }
  @Put('categories/:id') @LookupBody() replaceCategory(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.organizationService.updateCategory(id, b, true)
  }
  @Patch('categories/:id') @LookupBody() patchCategory(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.organizationService.updateCategory(id, b)
  }
  @Delete('categories/:id') deleteCategory(@Param('id') id: string) {
    return this.organizationService.deleteCategory(id)
  }
  @Patch('categories/:id/restore') restoreCategory(@Param('id') id: string) {
    return this.organizationService.restoreCategory(id)
  }

  @Get('branch') branches(@Query() q: CrudListQuery) {
    return this.organizationService.branches(q)
  }
  @Get('branch/deleted') deletedBranches(@Query() q: CrudListQuery) {
    return this.organizationService.branches({ ...q, onlyDeleted: true })
  }
  @Post('branch') @OrganizationBody() createBranch(@Body() b: Record<string, unknown>) {
    return this.organizationService.createBranch(b)
  }
  @Get('branch/:id') branch(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.organizationService.branch(id, includeDeleted === 'true')
  }
  @Put('branch/:id') @OrganizationBody() replaceBranch(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.organizationService.updateBranch(id, b, true)
  }
  @Patch('branch/:id') @OrganizationBody() patchBranch(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.organizationService.updateBranch(id, b)
  }
  @Delete('branch/:id') deleteBranch(@Param('id') id: string) {
    return this.organizationService.deleteBranch(id)
  }
  @Patch('branch/:id/restore') restoreBranch(@Param('id') id: string) {
    return this.organizationService.restoreBranch(id)
  }

  @Get(':id') get(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.organizationService.get(id, includeDeleted === 'true')
  }
  @Put(':id') @OrganizationBody() replace(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.organizationService.update(id, b, true)
  }
  @Patch(':id') @OrganizationBody() patch(@Param('id') id: string, @Body() b: Record<string, unknown>) {
    return this.organizationService.update(id, b)
  }
  @Delete(':id') delete(@Param('id') id: string) {
    return this.organizationService.delete(id)
  }
  @Patch(':id/restore') restore(@Param('id') id: string) {
    return this.organizationService.restore(id)
  }
}
