import type { ModelDefinition } from '@nestjs/mongoose'
import { SCHEMA_COMMON } from 'constants/schema'
import { adminSchema } from 'modules/accounts/models/admin'
import { staffSchema } from 'modules/accounts/models/staff'
import { userSchema } from 'modules/accounts/models/user'
import { accountRoleSchema, accountStatusSchema, accountTokenSchema, refreshTokenSchema } from 'modules/auth/models'
import { messageSchema, conversationSchema } from 'modules/chat/models'
import { clientSchema } from 'modules/client/models'
import { ArticleSchema, ContactSchema, notifyHistorySchema, planSchema } from 'modules/common/models'
import { assessmentSchema } from 'modules/content/assessment.model'
import { notificationInboxSchema } from 'modules/notifications/notification-inbox.model'
import { pushDeviceSchema } from 'modules/notifications/push-device.model'
import { orgBranchSchema, orgSchema } from 'modules/organization/models'
import { trainerSchema } from 'modules/trainer/models'
import { ExerciseSchema, MuscleSchema, WorkoutSessionSchema } from 'modules/workout/models'

export const MODEL_NAMES = {
  user: 'users',
  admin: 'data_admin',
  staff: 'data_staff',
  accountRole: 'account_role',
  accountStatus: 'account_status',
  accountToken: 'account_token',
  refreshToken: 'refresh_token',
  client: 'client',
  trainer: 'trainer',
  message: 'messages',
  conversation: 'conversations',
  notification: 'notifications',
  notificationInbox: 'notification_inbox',
  pushDevice: 'push_device',
  plan: 'plan',
  article: 'article',
  articleCategory: 'article_categories',
  news: 'news',
  course: 'course',
  states: 'states',
  schedule: 'schedules',
  guide: 'guides',
  contact: 'contacts',
  assessment: 'assessment',
  organization: 'organizations',
  organizationBranch: 'organization_branches',
  organizationCategory: 'organization_categories',
  exercise: 'exercises',
  equipment: 'equipments',
  exerciseGoal: 'exercise_goals',
  exerciseLevel: 'exercise_levels',
  muscleCategory: 'muscle_categories',
  exerciseCategory: 'exercise_categories',
  workoutSession: 'workout_sessions',
  muscle: 'muscles'
} as const

export const modelDefinitions: ModelDefinition[] = [
  { name: MODEL_NAMES.user, schema: userSchema },
  { name: MODEL_NAMES.admin, schema: adminSchema },
  { name: MODEL_NAMES.staff, schema: staffSchema },
  { name: MODEL_NAMES.accountRole, schema: accountRoleSchema },
  { name: MODEL_NAMES.accountStatus, schema: accountStatusSchema },
  { name: MODEL_NAMES.accountToken, schema: accountTokenSchema },
  { name: MODEL_NAMES.refreshToken, schema: refreshTokenSchema },
  { name: MODEL_NAMES.client, schema: clientSchema },
  { name: MODEL_NAMES.trainer, schema: trainerSchema },
  { name: MODEL_NAMES.message, schema: messageSchema },
  { name: MODEL_NAMES.conversation, schema: conversationSchema },
  { name: MODEL_NAMES.notification, schema: notifyHistorySchema },
  { name: MODEL_NAMES.notificationInbox, schema: notificationInboxSchema },
  { name: MODEL_NAMES.pushDevice, schema: pushDeviceSchema },
  { name: MODEL_NAMES.plan, schema: planSchema },
  { name: MODEL_NAMES.article, schema: ArticleSchema },
  { name: MODEL_NAMES.articleCategory, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.news, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.course, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.states, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.schedule, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.guide, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.contact, schema: ContactSchema },
  { name: MODEL_NAMES.assessment, schema: assessmentSchema },
  { name: MODEL_NAMES.organization, schema: orgSchema },
  { name: MODEL_NAMES.organizationBranch, schema: orgBranchSchema },
  { name: MODEL_NAMES.organizationCategory, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.exercise, schema: ExerciseSchema },
  { name: MODEL_NAMES.equipment, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.exerciseGoal, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.exerciseLevel, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.muscleCategory, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.exerciseCategory, schema: SCHEMA_COMMON },
  { name: MODEL_NAMES.workoutSession, schema: WorkoutSessionSchema },
  { name: MODEL_NAMES.muscle, schema: MuscleSchema }
]
