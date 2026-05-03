import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import type { Queue } from 'bullmq'
import { ExpoPushService, type SendMultipleDevicePayload, type SendSystemNotificationPayload } from 'modules/notifications/push/send-notify'

type PushJob =
  | {
      type: 'tokens'
      payload: SendMultipleDevicePayload
    }
  | {
      type: 'system'
      payload: SendSystemNotificationPayload
    }

@Injectable()
export class PushQueueService {
  private readonly logger = new Logger(PushQueueService.name)
  private readonly queue: PushJob[] = []
  private isProcessing = false

  constructor(
    @Inject(ExpoPushService) private readonly expoPushService: ExpoPushService,
    @Optional() @InjectQueue('push-notifications') private readonly bullQueue?: Queue<PushJob>
  ) {}

  enqueuePushToTokens(payload: SendMultipleDevicePayload) {
    if (this.bullQueue) {
      void this.bullQueue.add('tokens', { type: 'tokens', payload }, this.defaultJobOptions())
      return
    }
    this.queue.push({ type: 'tokens', payload })
    this.scheduleProcessing()
  }

  enqueueSystemPush(payload: SendSystemNotificationPayload) {
    if (this.bullQueue) {
      void this.bullQueue.add('system', { type: 'system', payload }, this.defaultJobOptions())
      return
    }
    this.queue.push({ type: 'system', payload })
    this.scheduleProcessing()
  }

  get size() {
    return this.queue.length
  }

  private defaultJobOptions() {
    return {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 500,
      removeOnFail: 1_000
    }
  }

  private scheduleProcessing() {
    setImmediate(() => {
      void this.processNextJob()
    })
  }

  private async processNextJob() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()
      if (!job) continue

      try {
        if (job.type === 'tokens') {
          await this.expoPushService.sendToTokens(job.payload)
        } else {
          await this.expoPushService.sendSystemNotification(job.payload)
        }
      } catch (error) {
        this.logger.error('Push notification job failed', error)
      }
    }

    this.isProcessing = false
  }
}
