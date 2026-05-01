interface Message {
  message: string
  imageUrl?: string
  videoUrl?: string
  seen: boolean
  sent: boolean
  delivered: boolean
  deliveredAt?: Date
  seenAt?: Date
  conversationId: import('mongoose').Types.ObjectId
  receiver: import('mongoose').Types.ObjectId
  msgByUserId: import('mongoose').Types.ObjectId
  clientMessageId?: string
}

interface Conversation {
  sender: import('mongoose').Types.ObjectId
  receiver: import('mongoose').Types.ObjectId
  participants: import('mongoose').Types.ObjectId[]
  participantKey: string
  lastMessage: import('mongoose').Types.ObjectId
  lastMessageAt?: Date
}
