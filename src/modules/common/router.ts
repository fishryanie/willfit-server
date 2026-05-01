import * as express from 'express'
import { baseRESTful } from 'utils/helpers'
import {
  articleCategoriesModel,
  articleModel,
  courseModel,
  guideModel,
  newsModel,
  planModel,
  scheduleModel,
  statesModel
} from './models'
import {
  createCmsNotification,
  createNewContact,
  findContactList,
  getNotifyByUser,
  registerPushDevice,
  updateProcessContact,
  updateReadNotification,
  userDeleteNotification
} from './controller'
import { verifyToken } from 'middleware/auth'

const router = express.Router()
router.post('/push/register-device', registerPushDevice)
router.get('/notifications', verifyToken, getNotifyByUser)
router.patch('/notifications/read/:id', verifyToken, updateReadNotification)
router.delete('/notifications/remove/:id', verifyToken, userDeleteNotification)

router.get('/contact', findContactList)
router.post('/contact', createNewContact)
router.patch('/contact', updateProcessContact)

router.post('/notifications/cms', verifyToken, createCmsNotification)
baseRESTful('/plan', router, planModel)
baseRESTful('/states', router, statesModel)
baseRESTful('/schedule', router, scheduleModel)
baseRESTful('/guide', router, guideModel)
baseRESTful('/news', router, newsModel)
baseRESTful('/course', router, courseModel)
baseRESTful('/article-categories', router, articleCategoriesModel)
baseRESTful('/article', router, articleModel, {
  populate: [{ path: 'category', select: ['-__v'] }]
})

export default router
