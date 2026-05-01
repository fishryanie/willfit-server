import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import { Database, Resource } from '@adminjs/mongoose'
import { componentLoader, Components } from './components'
import { dashboardHandler } from './dashboard'
import { adminResources } from './resources'

AdminJS.registerAdapter({ Database, Resource })

export const admin = new AdminJS({
  rootPath: '/admin',
  componentLoader,
  dashboard: {
    component: Components.Dashboard,
    handler: dashboardHandler
  },
  resources: adminResources,
  branding: {
    companyName: 'WillFit Admin',
    withMadeWithLove: false
  }
})

export const adminRouter = AdminJSExpress.buildRouter(admin)
