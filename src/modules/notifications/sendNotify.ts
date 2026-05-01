import { pushDeviceModel } from 'models'

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_MAX_BATCH_SIZE = 100
const EXPO_MAX_CONCURRENT_BATCHES = 5

type NotificationContent = {
  title?: string
  body?: string
}

type NotificationData = Record<string, unknown>

type SendSingleDevicePayload = {
  token: string
  notification?: NotificationContent
  data?: NotificationData
  sound?: 'default' | null
  channelId?: string
}

export type SendMultipleDevicePayload = {
  tokens: string[]
  notification?: NotificationContent
  data?: NotificationData
  sound?: 'default' | null
  channelId?: string
}

export type SendSystemNotificationPayload = {
  notification?: NotificationContent
  data?: NotificationData
  sound?: 'default' | null
  channelId?: string
  accountIds?: string[]
}

const buildExpoHeaders = () => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json'
  }
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
  }
  return headers
}

export const isExpoPushToken = (token?: string | null): token is string => {
  if (!token) return false
  return /^(ExpoPushToken|ExponentPushToken)\[[^\]]+\]$/.test(token)
}

const postToExpoPushApi = async (messages: Record<string, unknown> | Array<Record<string, unknown>>) => {
  const response = await fetch(EXPO_PUSH_API_URL, {
    method: 'POST',
    headers: buildExpoHeaders(),
    body: JSON.stringify(messages)
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('Expo push request failed:', result)
    return null
  }
  return result
}

const createExpoMessage = (payload: {
  to: string
  notification?: NotificationContent
  data?: NotificationData
  sound?: 'default' | null
  channelId?: string
}) => {
  return {
    to: payload.to,
    title: payload.notification?.title,
    body: payload.notification?.body,
    data: payload.data,
    sound: payload.sound ?? 'default',
    channelId: payload.channelId ?? 'default'
  }
}

const chunkTokens = (tokens: string[], chunkSize: number) => {
  const chunks: string[][] = []
  for (let index = 0; index < tokens.length; index += chunkSize) {
    chunks.push(tokens.slice(index, index + chunkSize))
  }
  return chunks
}

const deactivateInvalidExpoTokens = async (tokens: string[], result: unknown) => {
  const tickets = (result as { data?: Array<{ status?: string; message?: string; details?: { error?: string } }> } | null)?.data
  if (!Array.isArray(tickets)) {
    return
  }

  const invalidTokens = tickets
    .map((ticket, index) => ({ ticket, token: tokens[index] }))
    .filter(({ ticket }) => ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered')
    .map(({ token }) => token)
    .filter(Boolean)

  if (invalidTokens.length > 0) {
    await pushDeviceModel.updateMany({ token: { $in: invalidTokens } }, { $set: { active: false } }).exec()
  }
}

export const handleSendingNotifyDevice = async (message: SendSingleDevicePayload) => {
  if (!isExpoPushToken(message.token)) {
    console.warn('Skip notification. Invalid Expo push token:', message.token)
    return null
  }
  try {
    const result = await postToExpoPushApi(createExpoMessage({ ...message, to: message.token }))
    console.log('Successfully sent Expo push notification:', result)
    return result
  } catch (error) {
    console.error('Error sending Expo push notification:', error)
    return null
  }
}

export const handleSendingMultipleDevices = async (message: SendMultipleDevicePayload) => {
  const validTokens = message.tokens.filter((token) => isExpoPushToken(token))
  const invalidCount = message.tokens.length - validTokens.length
  if (!validTokens.length) {
    console.warn('Skip multicast notification. No valid Expo push token.')
    return []
  }
  if (invalidCount > 0) {
    console.warn(`Skip ${invalidCount} invalid Expo push token(s).`)
  }
  const tokenChunks = chunkTokens(validTokens, EXPO_MAX_BATCH_SIZE)
  const results: unknown[] = []
  try {
    for (let index = 0; index < tokenChunks.length; index += EXPO_MAX_CONCURRENT_BATCHES) {
      const chunkGroup = tokenChunks.slice(index, index + EXPO_MAX_CONCURRENT_BATCHES)
      const groupResults = await Promise.all(
        chunkGroup.map(async (tokenChunk) => {
          const messages = tokenChunk.map((token) =>
            createExpoMessage({
              to: token,
              notification: message.notification,
              data: message.data,
              sound: message.sound,
              channelId: message.channelId
            })
          )
          const result = await postToExpoPushApi(messages)
          await deactivateInvalidExpoTokens(tokenChunk, result)
          return result
        })
      )
      results.push(...groupResults)
    }
    console.log('Multicast Expo notifications sent:', {
      totalTokens: validTokens.length,
      batches: tokenChunks.length
    })
  } catch (error) {
    console.error('Error sending multicast Expo notifications:', error)
  }
  return results
}

export const handleSendingSystemNotification = async (message: SendSystemNotificationPayload) => {
  const filter: Record<string, unknown> = { active: true, notificationEnabled: { $ne: false } }
  if (message.accountIds?.length) {
    filter.accountId = { $in: message.accountIds }
  }
  const tokens = await pushDeviceModel.distinct('token', filter)
  if (!tokens.length) {
    return []
  }
  return handleSendingMultipleDevices({
    tokens,
    notification: message.notification,
    data: message.data,
    sound: message.sound,
    channelId: message.channelId
  })
}
