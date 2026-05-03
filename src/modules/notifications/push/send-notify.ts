import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { MODEL_NAMES } from 'modules/database/model-registry'
import type { Model } from 'mongoose'
import { firstValueFrom } from 'rxjs'

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

export const isExpoPushToken = (token?: string | null): token is string => {
  if (!token) return false
  return /^(ExpoPushToken|ExponentPushToken)\[[^\]]+\]$/.test(token)
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

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name)

  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @InjectModel(MODEL_NAMES.pushDevice) private readonly pushDeviceModel: Model<IPushDevice>
  ) {}

  private buildExpoHeaders() {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json'
    }
    const accessToken = this.configService.get<string>('app.expo.accessToken')
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    return headers
  }

  private async postToExpoPushApi(messages: Record<string, unknown> | Array<Record<string, unknown>>) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(EXPO_PUSH_API_URL, messages, {
          headers: this.buildExpoHeaders()
        })
      )
      return response.data
    } catch (error) {
      this.logger.error('Expo push request failed', error)
      return null
    }
  }

  private async deactivateInvalidExpoTokens(tokens: string[], result: unknown) {
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
      await this.pushDeviceModel.updateMany({ token: { $in: invalidTokens } }, { $set: { active: false } }).exec()
    }
  }

  async sendToDevice(message: SendSingleDevicePayload) {
    if (!isExpoPushToken(message.token)) {
      this.logger.warn(`Skip notification. Invalid Expo push token: ${message.token}`)
      return null
    }
    const result = await this.postToExpoPushApi(createExpoMessage({ ...message, to: message.token }))
    this.logger.log('Expo push notification sent')
    return result
  }

  async sendToTokens(message: SendMultipleDevicePayload) {
    const validTokens = message.tokens.filter((token) => isExpoPushToken(token))
    const invalidCount = message.tokens.length - validTokens.length
    if (!validTokens.length) {
      this.logger.warn('Skip multicast notification. No valid Expo push token.')
      return []
    }
    if (invalidCount > 0) {
      this.logger.warn(`Skip ${invalidCount} invalid Expo push token(s).`)
    }
    const tokenChunks = chunkTokens(validTokens, EXPO_MAX_BATCH_SIZE)
    const results: unknown[] = []
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
          const result = await this.postToExpoPushApi(messages)
          await this.deactivateInvalidExpoTokens(tokenChunk, result)
          return result
        })
      )
      results.push(...groupResults)
    }
    this.logger.log(`Multicast Expo notifications sent: ${validTokens.length} token(s), ${tokenChunks.length} batch(es)`)
    return results
  }

  async sendSystemNotification(message: SendSystemNotificationPayload) {
    const filter: Record<string, unknown> = { active: true, notificationEnabled: { $ne: false } }
    if (message.accountIds?.length) {
      filter.accountId = { $in: message.accountIds }
    }
    const tokens = await this.pushDeviceModel.distinct('token', filter)
    if (!tokens.length) {
      return []
    }
    return this.sendToTokens({
      tokens,
      notification: message.notification,
      data: message.data,
      sound: message.sound,
      channelId: message.channelId
    })
  }
}
