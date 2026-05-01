import * as express from 'express'
import { createNewAdmin, findAllAdmin, findAdminDetail } from './adminController'
import { createNewStaff, findAllStaff, findStaffDetail } from './staffController'

const userRoutes = express.Router()

userRoutes.get('/admin', findAllAdmin)
userRoutes.get('/admin_detail', findAdminDetail)
userRoutes.post('/admin', createNewAdmin)

userRoutes.get('/staff', findAllStaff)
userRoutes.get('/staff_detail', findStaffDetail)
userRoutes.post('/staff', createNewStaff)

export default userRoutes
