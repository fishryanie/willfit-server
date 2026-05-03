import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import { Database, Resource } from '@adminjs/mongoose'
import type { Connection } from 'mongoose'
import { componentLoader, Components } from './components'
import { createDashboardHandler } from './dashboard'
import { getAdminResources } from './resources'

AdminJS.registerAdapter({ Database, Resource })

export const createAdminRouter = (connection: Connection) => {
  const admin = new AdminJS({
    rootPath: '/admin',
    componentLoader,
    dashboard: {
      component: Components.Dashboard,
      handler: createDashboardHandler(connection)
    },
    resources: getAdminResources(connection),
    branding: {
      companyName: 'WillFit Admin',
      withMadeWithLove: false
    }
  })

  return { admin, adminRouter: AdminJSExpress.buildRouter(admin) }
}
