import * as express from 'express'
import { baseRESTful } from 'utils/helpers'
import { createBranch, getSelectOrganization, getListBranch } from './controller'
import { orgCategoryModel, orgModel } from './models'

const router = express.Router()
const optionOrganization = {
  populate: [{ path: 'categoryId', select: ['category', 'description'] }]
}
router.get('/select', getSelectOrganization)
router.get('/branch', getListBranch)
router.post('/branch', createBranch)

baseRESTful('/categories', router, orgCategoryModel)
baseRESTful('', router, orgModel, optionOrganization)

export default router
