import * as express from 'express'
import { createTrainer, getTrainer } from './controller'

const router = express.Router()

router.get('', getTrainer)
router.post('', createTrainer)

export default router
