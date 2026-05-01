import * as express from 'express'
import { verifyToken } from 'middleware/auth'
import { getChatHistory, getMessage, markMessagesRead, sendMessage } from './controller'

const router = express.Router()

router.get('/messages', verifyToken, getMessage)
router.get('/messages-history', verifyToken, getChatHistory)
router.post('/messages', verifyToken, sendMessage)
router.patch('/messages/read/:conversationId', verifyToken, markMessagesRead)

export default router
