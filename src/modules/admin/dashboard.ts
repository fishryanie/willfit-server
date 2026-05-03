import type { PageHandler } from 'adminjs'
import type { Connection, Model } from 'mongoose'
import { MODEL_NAMES } from 'modules/database/model-registry'

type TimestampedContact = IContact & {
  _id: unknown
  createdAt?: Date | string
}

const daysAgo = (days: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date
}

const countSince = (model: { countDocuments: (filter?: Record<string, unknown>) => Promise<number> }, days: number) =>
  model.countDocuments({ createdAt: { $gte: daysAgo(days) } })

const createMetric = (label: string, value: number, helper: string, tone: string) => ({
  label,
  value,
  helper,
  tone
})

const model = (connection: Connection, name: string) => connection.model(name) as Model<any>

export const createDashboardHandler = (connection: Connection): PageHandler => async () => {
  const userModel = model(connection, MODEL_NAMES.user)
  const clientModel = model(connection, MODEL_NAMES.client)
  const trainerModel = model(connection, MODEL_NAMES.trainer)
  const workoutSessionModel = model(connection, MODEL_NAMES.workoutSession)
  const orgModel = model(connection, MODEL_NAMES.organization)
  const orgBranchModel = model(connection, MODEL_NAMES.organizationBranch)
  const articleModel = model(connection, MODEL_NAMES.article)
  const notifyModel = model(connection, MODEL_NAMES.notification)
  const pushDeviceModel = model(connection, MODEL_NAMES.pushDevice)
  const contactModel = model(connection, MODEL_NAMES.contact)
  const messageModel = model(connection, MODEL_NAMES.message)
  const conversationModel = model(connection, MODEL_NAMES.conversation)
  const notificationInboxModel = model(connection, MODEL_NAMES.notificationInbox)

  const [
    totalUsers,
    totalClients,
    totalTrainers,
    totalWorkouts,
    totalOrganizations,
    totalBranches,
    totalArticles,
    totalNotifications,
    activePushDevices,
    openContacts,
    recentUsers,
    recentClients,
    recentWorkouts,
    recentMessages,
    recentContacts,
    latestContacts
  ] = await Promise.all([
    userModel.countDocuments(),
    clientModel.countDocuments(),
    trainerModel.countDocuments(),
    workoutSessionModel.countDocuments(),
    orgModel.countDocuments(),
    orgBranchModel.countDocuments(),
    articleModel.countDocuments(),
    notifyModel.countDocuments(),
    pushDeviceModel.countDocuments(),
    contactModel.countDocuments({ processed: false }),
    countSince(userModel, 30),
    countSince(clientModel, 30),
    countSince(workoutSessionModel, 30),
    countSince(messageModel, 7),
    countSince(contactModel, 7),
    contactModel.find().sort({ createdAt: -1 }).limit(5).lean()
  ])

  const totalPeople = totalClients + totalTrainers
  const trainerLoad = totalTrainers > 0 ? Math.round((totalClients / totalTrainers) * 10) / 10 : 0

  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      createMetric('Users', totalUsers, `${recentUsers} new in 30 days`, 'blue'),
      createMetric('Clients', totalClients, `${totalPeople} people profiles`, 'green'),
      createMetric('Trainers', totalTrainers, `${trainerLoad} clients / trainer`, 'orange'),
      createMetric('Workouts', totalWorkouts, `${recentWorkouts} new in 30 days`, 'purple')
    ],
    operations: [
      { label: 'Organizations', value: totalOrganizations, helper: `${totalBranches} branches` },
      { label: 'Articles', value: totalArticles, helper: 'Content library' },
      { label: 'Notifications', value: totalNotifications, helper: `${activePushDevices} push devices` },
      { label: 'Open contacts', value: openContacts, helper: `${recentContacts} arrived this week` }
    ],
    activity: [
      { label: 'New users', value: recentUsers, max: Math.max(recentUsers, recentClients, recentWorkouts, 1) },
      { label: 'New clients', value: recentClients, max: Math.max(recentUsers, recentClients, recentWorkouts, 1) },
      { label: 'Workout plans', value: recentWorkouts, max: Math.max(recentUsers, recentClients, recentWorkouts, 1) },
      { label: 'Chat messages', value: recentMessages, max: Math.max(recentMessages, recentContacts, 1) },
      { label: 'Contact leads', value: recentContacts, max: Math.max(recentMessages, recentContacts, 1) }
    ],
    latestContacts: (latestContacts as TimestampedContact[]).map((contact) => ({
      id: String(contact._id),
      name: contact.name,
      email: contact.email,
      type: contact.type,
      processed: contact.processed,
      createdAt: contact.createdAt
    })),
    quickLinks: [
      { label: 'Clients', resourceId: 'client' },
      { label: 'Trainers', resourceId: 'trainer' },
      { label: 'Workout sessions', resourceId: 'workout_sessions' },
      { label: 'Contacts', resourceId: 'contacts' },
      { label: 'Notifications', resourceId: 'notifications' },
      { label: 'Organizations', resourceId: 'organizations' }
    ],
    inbox: {
      conversations: await conversationModel.countDocuments(),
      messagesLastWeek: recentMessages,
      notificationInbox: await notificationInboxModel.countDocuments()
    }
  }
}
