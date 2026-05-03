import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from 'modules/shared/auth.guard'
import { type CrudListQuery } from 'modules/shared/crud.service'
import { ChatMessageBody } from 'modules/shared/swagger-body'
import { ChatService } from './chat.service'

const currentUserId = (req: Request) => (req as TokenVerifiedRequest).tokenVerified?.userId?.toString() || ''

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(@Inject(ChatService) private readonly chatService: ChatService) {}

  @Get('messages-history')
  listConversations(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.chatService.listConversations(currentUserId(req), query)
  }

  @Get('messages-history/deleted')
  listDeletedConversations(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.chatService.listConversations(currentUserId(req), { ...query, onlyDeleted: true })
  }

  @Get('messages')
  listMessages(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.chatService.listMessages(currentUserId(req), query)
  }

  @Get('messages/deleted')
  listDeletedMessages(@Req() req: Request, @Query() query: CrudListQuery) {
    return this.chatService.listMessages(currentUserId(req), { ...query, onlyDeleted: true })
  }

  @Post('messages')
  @ChatMessageBody()
  sendMessage(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.chatService.sendMessage(currentUserId(req), body)
  }

  @Patch('messages/read/:conversationId')
  markRead(@Req() req: Request, @Param('conversationId') conversationId: string) {
    return this.chatService.markRead(currentUserId(req), conversationId)
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string) {
    return this.chatService.deleteMessage(id)
  }

  @Patch('messages/:id/restore')
  restoreMessage(@Param('id') id: string) {
    return this.chatService.restoreMessage(id)
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string) {
    return this.chatService.deleteConversation(id)
  }

  @Patch('conversations/:id/restore')
  restoreConversation(@Param('id') id: string) {
    return this.chatService.restoreConversation(id)
  }
}
