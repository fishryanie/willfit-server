import { Types } from 'mongoose'
import { TypeNotify } from 'enums/common'
import { notificationInboxModel } from 'models'
import { notifyModel } from 'modules/common/models'
import { enqueueSystemPush } from './queue/pushQueue'
import { accountTokenModel } from 'modules/auth/models'

const BULK_WRITE_CHUNK_SIZE = 1_000

const chunkArray = <T>(items: T[], chunkSize: number) => {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

const normalizeAccountIds = (accountIds?: unknown[]) => {
  const uniqueIds = new Set<string>()
  accountIds?.forEach((accountId) => {
    if (typeof accountId === 'string' && Types.ObjectId.isValid(accountId)) {
      uniqueIds.add(accountId)
    }
  })
  return Array.from(uniqueIds)
}

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined)

export const resolveNotificationAudience = async (payload: { accountIds?: unknown[]; sendToAll?: boolean }) => {
  const explicitAccountIds = normalizeAccountIds(payload.accountIds)
  if (explicitAccountIds.length > 0) {
    return explicitAccountIds
  }

  if (!payload.sendToAll) {
    return []
  }

  const accountIds = await accountTokenModel.distinct('accountId', { accountId: { $exists: true } })
  return normalizeAccountIds(accountIds.map((accountId) => accountId?.toString()))
}

export const createNotificationInboxEntries = async (notificationId: string, accountIds: string[]) => {
  if (accountIds.length === 0) {
    return 0
  }

  let upsertedOrMatched = 0
  for (const accountIdChunk of chunkArray(accountIds, BULK_WRITE_CHUNK_SIZE)) {
    const notificationObjectId = new Types.ObjectId(notificationId)
    const result = await notificationInboxModel.bulkWrite(
      accountIdChunk.map((accountId) => ({
        updateOne: {
          filter: { notification: notificationObjectId, accountId: new Types.ObjectId(accountId) },
          update: {
            $setOnInsert: {
              notification: notificationObjectId,
              accountId: new Types.ObjectId(accountId)
            }
          },
          upsert: true
        }
      })),
      { ordered: false }
    )
    upsertedOrMatched += result.upsertedCount + result.matchedCount
  }
  return upsertedOrMatched
}

export const createNotificationWithAudience = async (payload: Record<string, unknown>) => {
  const privateWith = Array.isArray(payload.privateWith) ? payload.privateWith : []
  const sendToAll = payload.sendToAll === true
  const sendPush = payload.sendPush === true
  const accountIds = await resolveNotificationAudience({ accountIds: privateWith, sendToAll })
  const notification = await notifyModel.create({
    name: getString(payload.name),
    imageUrl: getString(payload.imageUrl),
    videoUrl: getString(payload.videoUrl),
    description: getString(payload.description),
    content: getString(payload.content),
    type: typeof payload.type === 'string' ? payload.type : TypeNotify.All,
    privateWith: sendToAll ? [] : accountIds
  } as any)
  const inboxCount = await createNotificationInboxEntries(notification._id.toString(), accountIds)

  if (sendPush && accountIds.length > 0) {
    enqueueSystemPush({
      accountIds,
      notification: {
        title: typeof payload.name === 'string' ? payload.name : 'WillFit',
        body: typeof payload.description === 'string' ? payload.description : typeof payload.content === 'string' ? payload.content : undefined
      },
      data: {
        type: 'notification',
        notificationId: notification._id.toString()
      }
    })
  }

  return { notification, inboxCount, audienceCount: accountIds.length }
}
