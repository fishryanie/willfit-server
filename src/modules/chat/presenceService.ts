import type { Server, Socket } from 'socket.io'

const onlineUsers = new Map<string, Set<string>>()

export const userRoom = (userId: string) => `user:${userId}`

export const getOnlineSocketIds = (userId: string) => {
  return onlineUsers.get(userId)
}

export const isUserOnline = (userId: string) => {
  return (onlineUsers.get(userId)?.size || 0) > 0
}

const addSocket = (userId: string, socketId: string) => {
  const socketSet = onlineUsers.get(userId) || new Set<string>()
  socketSet.add(socketId)
  onlineUsers.set(userId, socketSet)
}

const removeSocket = (userId: string, socketId: string) => {
  const socketSet = onlineUsers.get(userId)
  if (!socketSet) return false

  socketSet.delete(socketId)
  if (socketSet.size === 0) {
    onlineUsers.delete(userId)
    return true
  }
  return false
}

export const registerPresenceSocket = (io: Server, socket: Socket, userId: string) => {
  addSocket(userId, socket.id)
  socket.join(userRoom(userId))
  io.emit('userStatusChanged', { userId, isOnline: true })

  socket.on('online', () => {
    addSocket(userId, socket.id)
    socket.emit('userStatus', { userId, isOnline: true })
  })

  socket.on('userStatus', (targetUserId: string, callback?: (payload: { userId: string; isOnline: boolean }) => void) => {
    const payload = { userId: targetUserId, isOnline: isUserOnline(targetUserId) }
    if (typeof callback === 'function') {
      callback(payload)
      return
    }
    socket.emit('userStatus', payload)
  })

  socket.on('disconnect', () => {
    const becameOffline = removeSocket(userId, socket.id)
    if (becameOffline) {
      io.emit('userStatusChanged', { userId, isOnline: false, lastSeenAt: new Date().toISOString() })
    }
  })
}
