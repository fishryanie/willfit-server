import { adminModel } from 'modules/accounts/models/admin'
import { staffModel } from 'modules/accounts/models/staff'
import { userModel } from 'modules/accounts/models/user'
import { assessmentModel } from 'modules/assessment/models'
import { accountRoleModel, accountStatusModel, accountTokenModel, refreshTokenModel } from 'modules/auth/models'
import { conversationModel, messageModel } from 'modules/chat/models'
import { clientModel } from 'modules/client/models'
import {
  articleCategoriesModel,
  articleModel,
  contactModel,
  courseModel,
  guideModel,
  newsModel,
  notifyModel,
  planModel,
  scheduleModel,
  statesModel
} from 'modules/common/models'
import { notificationInboxModel } from 'modules/notifications/models/notificationInbox'
import { pushDeviceModel } from 'modules/notifications/models/pushDevice'
import { orgBranchModel, orgCategoryModel, orgModel } from 'modules/organization/models'
import { trainerModel } from 'modules/trainer/models'
import {
  equipmentModel,
  exerciseCategoriesModel,
  exerciseGoalModel,
  exerciseLevelModel,
  exerciseModel,
  muscleCategoriesModel,
  muscleModel,
  workoutSessionModel
} from 'modules/workout/schema'

const navigation = (name: string) => ({ name })

const resource = (model: unknown, group: string, options: Record<string, unknown> = {}) => ({
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

const adminModels = [
  userModel,
  adminModel,
  staffModel,
  accountTokenModel,
  refreshTokenModel,
  accountRoleModel,
  accountStatusModel,
  clientModel,
  trainerModel,
  orgModel,
  orgBranchModel,
  orgCategoryModel,
  workoutSessionModel,
  exerciseModel,
  equipmentModel,
  exerciseGoalModel,
  exerciseLevelModel,
  exerciseCategoriesModel,
  muscleModel,
  muscleCategoriesModel,
  assessmentModel,
  conversationModel,
  messageModel,
  notifyModel,
  notificationInboxModel,
  pushDeviceModel,
  planModel,
  articleModel,
  articleCategoriesModel,
  newsModel,
  courseModel,
  guideModel,
  scheduleModel,
  statesModel,
  contactModel
]

adminModels.forEach((model) => {
  Object.values(model.schema.paths).forEach((schemaPath) => {
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

export const adminResources = [
  resource(userModel, 'Accounts'),
  resource(adminModel, 'Accounts'),
  resource(staffModel, 'Accounts'),
  resource(accountTokenModel, 'Auth', {
    properties: {
      password: hiddenSecret,
      fcmToken: hiddenSecret
    }
  }),
  resource(refreshTokenModel, 'Auth', {
    properties: {
      token: hiddenSecret
    }
  }),
  resource(accountRoleModel, 'Auth'),
  resource(accountStatusModel, 'Auth'),

  resource(clientModel, 'People'),
  resource(trainerModel, 'People'),

  resource(orgModel, 'Organizations'),
  resource(orgBranchModel, 'Organizations'),
  resource(orgCategoryModel, 'Organizations'),

  resource(workoutSessionModel, 'Workout'),
  resource(exerciseModel, 'Workout'),
  resource(equipmentModel, 'Workout'),
  resource(exerciseGoalModel, 'Workout'),
  resource(exerciseLevelModel, 'Workout'),
  resource(exerciseCategoriesModel, 'Workout'),
  resource(muscleModel, 'Workout'),
  resource(muscleCategoriesModel, 'Workout'),

  resource(assessmentModel, 'Assessment'),

  resource(conversationModel, 'Chat'),
  resource(messageModel, 'Chat'),

  resource(notifyModel, 'Notifications'),
  resource(notificationInboxModel, 'Notifications'),
  resource(pushDeviceModel, 'Notifications', {
    properties: {
      token: hiddenSecret
    }
  }),

  resource(planModel, 'Content'),
  resource(articleModel, 'Content'),
  resource(articleCategoriesModel, 'Content'),
  resource(newsModel, 'Content'),
  resource(courseModel, 'Content'),
  resource(guideModel, 'Content'),
  resource(scheduleModel, 'Content'),
  resource(statesModel, 'Content'),
  resource(contactModel, 'Content')
]
