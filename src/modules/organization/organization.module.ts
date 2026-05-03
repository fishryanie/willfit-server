import { Module } from '@nestjs/common'
import { SharedNestModule } from 'modules/shared/common.module'
import { OrganizationController } from './organization.controller'
import { OrganizationService } from './organization.service'

@Module({ imports: [SharedNestModule], controllers: [OrganizationController], providers: [OrganizationService] })
export class OrganizationModule {}
