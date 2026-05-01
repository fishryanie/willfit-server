import express from 'express'
import assessmentRoute from 'modules/assessment/router'
import authRoute from 'modules/auth/router'
import chatRoute from 'modules/chat/router'
import clientRoute from 'modules/client/router'
import commonRoute from 'modules/common/router'
import organizationRoutes from 'modules/organization/router'
import storageRoute from 'modules/files/router'
import trainerRoute from 'modules/trainer/router'
import userRoutes from 'modules/users/router'
import workoutRoutes from 'modules/workout/router'
const router = express.Router()

router.use('/api', assessmentRoute)
router.use('/api', workoutRoutes)
router.use('/api/auth', authRoute)
router.use('/api/chat', chatRoute)
router.use('/api/client', clientRoute)
router.use('/api/cloud', storageRoute)
router.use('/api/common', commonRoute)
router.use('/api/organization', organizationRoutes)
router.use('/api/trainer', trainerRoute)
router.use('/api/user', userRoutes)
export default router
