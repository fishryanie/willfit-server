import {
  handleSendingMultipleDevices,
  handleSendingSystemNotification,
  type SendMultipleDevicePayload,
  type SendSystemNotificationPayload
} from 'modules/notifications/sendNotify'

type PushJob =
  | {
      type: 'tokens'
      payload: SendMultipleDevicePayload
    }
  | {
      type: 'system'
      payload: SendSystemNotificationPayload
    }

const queue: PushJob[] = []
let isProcessing = false

const processNextJob = async () => {
  if (isProcessing) return
  isProcessing = true

  while (queue.length > 0) {
    const job = queue.shift()
    if (!job) continue

    try {
      if (job.type === 'tokens') {
        await handleSendingMultipleDevices(job.payload)
      } else {
        await handleSendingSystemNotification(job.payload)
      }
    } catch (error) {
      console.error('Push notification job failed:', error)
    }
  }

  isProcessing = false
}

const scheduleProcessing = () => {
  setImmediate(() => {
    void processNextJob()
  })
}

export const enqueuePushToTokens = (payload: SendMultipleDevicePayload) => {
  queue.push({ type: 'tokens', payload })
  scheduleProcessing()
}

export const enqueueSystemPush = (payload: SendSystemNotificationPayload) => {
  queue.push({ type: 'system', payload })
  scheduleProcessing()
}

export const getPushQueueSize = () => queue.length
