import * as express from 'express'
import { verifyToken } from 'middleware/auth'
import {
  clientDeleteAccount,
  clientProfile,
  createNewClient,
  getClientList,
  updateClient
} from './controller'

const router = express.Router()
router.get('', verifyToken, getClientList)
router.post('', verifyToken, createNewClient)
router.put('', verifyToken, updateClient)

router.get('/profile', verifyToken, clientProfile)
router.delete('/delete-account', verifyToken, clientDeleteAccount)

export default router
