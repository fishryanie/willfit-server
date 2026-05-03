import type { Connection, Model } from 'mongoose'
import { MODEL_NAMES } from 'modules/database/model-registry'

const navigation = (name: string) => ({ name })

const resource = (model: Model<unknown>, group: string, options: Record<string, unknown> = {}) => ({
  resource: model as any,
  options: {
    navigation: navigation(group),
    ...options
  }
})

const hiddenSecret = {
  isVisible: {
    list: false,
    filter: false,
    show: false,
    edit: true
  }
}

const model = (connection: Connection, name: string) => connection.model(name) as Model<unknown>

export const getAdminResources = (connection: Connection) => {
  const models = {
    user: model(connection, MODEL_NAMES.user),
    admin: model(connection, MODEL_NAMES.admin),
    staff: model(connection, MODEL_NAMES.staff),
    accountToken: model(connection, MODEL_NAMES.accountToken),
    refreshToken: model(connection, MODEL_NAMES.refreshToken),
    accountRole: model(connection, MODEL_NAMES.accountRole),
    accountStatus: model(connection, MODEL_NAMES.accountStatus),
    client: model(connection, MODEL_NAMES.client),
    trainer: model(connection, MODEL_NAMES.trainer),
    org: model(connection, MODEL_NAMES.organization),
    orgBranch: model(connection, MODEL_NAMES.organizationBranch),
    orgCategory: model(connection, MODEL_NAMES.organizationCategory),
    workoutSession: model(connection, MODEL_NAMES.workoutSession),
    exercise: model(connection, MODEL_NAMES.exercise),
    equipment: model(connection, MODEL_NAMES.equipment),
    exerciseGoal: model(connection, MODEL_NAMES.exerciseGoal),
    exerciseLevel: model(connection, MODEL_NAMES.exerciseLevel),
    exerciseCategory: model(connection, MODEL_NAMES.exerciseCategory),
    muscle: model(connection, MODEL_NAMES.muscle),
    muscleCategory: model(connection, MODEL_NAMES.muscleCategory),
    assessment: model(connection, MODEL_NAMES.assessment),
    conversation: model(connection, MODEL_NAMES.conversation),
    message: model(connection, MODEL_NAMES.message),
    notification: model(connection, MODEL_NAMES.notification),
    notificationInbox: model(connection, MODEL_NAMES.notificationInbox),
    pushDevice: model(connection, MODEL_NAMES.pushDevice),
    plan: model(connection, MODEL_NAMES.plan),
    article: model(connection, MODEL_NAMES.article),
    articleCategory: model(connection, MODEL_NAMES.articleCategory),
    news: model(connection, MODEL_NAMES.news),
    course: model(connection, MODEL_NAMES.course),
    guide: model(connection, MODEL_NAMES.guide),
    schedule: model(connection, MODEL_NAMES.schedule),
    states: model(connection, MODEL_NAMES.states),
    contact: model(connection, MODEL_NAMES.contact)
  }

  Object.values(models).forEach((adminModel) => {
    Object.values(adminModel.schema.paths).forEach((schemaPath) => {
      const path = schemaPath as typeof schemaPath & {
        caster?: unknown
        embeddedSchemaType?: unknown
        instance?: string
      }
      if (path.instance === 'Array' && !path.caster && path.embeddedSchemaType) {
        path.caster = path.embeddedSchemaType
      }
    })
  })

  return [
    resource(models.user, 'Accounts'),
    resource(models.admin, 'Accounts'),
    resource(models.staff, 'Accounts'),
    resource(models.accountToken, 'Auth', {
      properties: {
        password: hiddenSecret,
        fcmToken: hiddenSecret
      }
    }),
    resource(models.refreshToken, 'Auth', {
      properties: {
        token: hiddenSecret
      }
    }),
    resource(models.accountRole, 'Auth'),
    resource(models.accountStatus, 'Auth'),

    resource(models.client, 'People'),
    resource(models.trainer, 'People'),

    resource(models.org, 'Organizations'),
    resource(models.orgBranch, 'Organizations'),
    resource(models.orgCategory, 'Organizations'),

    resource(models.workoutSession, 'Workout'),
    resource(models.exercise, 'Workout'),
    resource(models.equipment, 'Workout'),
    resource(models.exerciseGoal, 'Workout'),
    resource(models.exerciseLevel, 'Workout'),
    resource(models.exerciseCategory, 'Workout'),
    resource(models.muscle, 'Workout'),
    resource(models.muscleCategory, 'Workout'),

    resource(models.assessment, 'Assessment'),

    resource(models.conversation, 'Chat'),
    resource(models.message, 'Chat'),

    resource(models.notification, 'Notifications'),
    resource(models.notificationInbox, 'Notifications'),
    resource(models.pushDevice, 'Notifications', {
      properties: {
        token: hiddenSecret
      }
    }),

    resource(models.plan, 'Content'),
    resource(models.article, 'Content'),
    resource(models.articleCategory, 'Content'),
    resource(models.news, 'Content'),
    resource(models.course, 'Content'),
    resource(models.guide, 'Content'),
    resource(models.schedule, 'Content'),
    resource(models.states, 'Content'),
    resource(models.contact, 'Content')
  ]
}
