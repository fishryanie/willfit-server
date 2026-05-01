import * as express from 'express'
import { baseRESTful } from 'utils/helpers'
import { assessmentModel } from './models'

const router = express.Router()

baseRESTful('/assessment', router, assessmentModel)

export default router
