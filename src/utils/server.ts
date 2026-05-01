import http from 'http'
import express from 'express'
import { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { getCorsOrigins } from 'config/env'
import { registerPresenceSocket } from 'modules/chat/presenceService'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST']
  },
  pingInterval: 25_000,
  pingTimeout: 20_000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 120_000,
    skipMiddlewares: false
  }
})

const extractSocketToken = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token
  const headerToken = socket.handshake.headers.authorization
  const token = typeof authToken === 'string' ? authToken : typeof headerToken === 'string' ? headerToken : ''
  return token.startsWith('Bearer ') ? token.slice('Bearer '.length) : token
}

io.use((socket, next) => {
  const token = extractSocketToken(socket)
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2') as TokenPayload
      socket.data.userId = payload.userId.toString()
      next()
      return
    } catch {
      next(new Error('Unauthorized socket connection'))
      return
    }
  }

  next(new Error('Unauthorized socket connection'))
})

io.on('connection', (socket) => {
  registerPresenceSocket(io, socket, socket.data.userId)
})

export { app, io, server }
