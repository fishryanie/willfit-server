import { Module } from '@nestjs/common'
import { SharedNestModule } from 'modules/shared/common.module'
import { NotificationsModule } from 'modules/notifications/notifications.module'
import { ChatController } from './chat.controller'
import { ChatGateway } from './chat.gateway'
import { PresenceService } from './presence.service'
import { ChatService } from './chat.service'

@Module({
  imports: [SharedNestModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatGateway, PresenceService, ChatService]
})
export class ChatModule {}
