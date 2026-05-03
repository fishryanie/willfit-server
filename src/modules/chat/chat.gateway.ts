import { Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { PresenceService, userRoom } from './presence.service'

const extractToken = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === 'string' && authToken) return authToken.replace(/^Bearer\s+/i, '')
  const header = socket.handshake.headers.authorization
  const [type, token] = typeof header === 'string' ? header.split(' ') : []
  return type === 'Bearer' ? token : undefined
}

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  pingInterval: 25_000,
  pingTimeout: 20_000,
  transports: ['websocket', 'polling'],
  connectionStateRecovery: {}
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server?: Server

  private readonly logger = new Logger(ChatGateway.name)

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PresenceService) private readonly presenceService: PresenceService
  ) {}

  handleConnection(socket: Socket) {
    try {
      const token = extractToken(socket)
      if (!token) throw new Error('Missing socket auth token')
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.configService.get<string>('app.jwt.secret') || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2'
      })
      if (!payload.userId) throw new Error('Invalid socket auth payload')
      socket.data.userId = payload.userId.toString()
      this.presenceService.registerSocket(this.requireServer(), socket, socket.data.userId)
    } catch (error) {
      this.logger.warn(`Socket rejected: ${(error as Error).message}`)
      socket.disconnect(true)
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = typeof socket.data.userId === 'string' ? socket.data.userId : undefined
    if (userId) this.presenceService.unregisterSocket(this.requireServer(), socket, userId)
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.requireServer().to(userRoom(userId)).emit(event, payload)
  }

  private requireServer() {
    if (!this.server) throw new Error('Socket server is not ready')
    return this.server
  }
}
