import { Module } from '@nestjs/common'
import { SharedNestModule } from 'modules/shared/common.module'
import { AccountsController } from './accounts.controller'
import { AccountsService } from './accounts.service'

@Module({ imports: [SharedNestModule], controllers: [AccountsController], providers: [AccountsService] })
export class AccountsModule {}
