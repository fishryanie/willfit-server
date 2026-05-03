import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import type { Job } from 'bullmq'
import { ExpoPushService } from 'modules/notifications/push/send-notify'
import type { SendMultipleDevicePayload, SendSystemNotificationPayload } from 'modules/notifications/push/send-notify'

type PushJob =
  | {
      type: 'tokens'
      payload: SendMultipleDevicePayload
    }
  | {
      type: 'system'
      payload: SendSystemNotificationPayload
    }

@Processor('push-notifications')
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name)

  constructor(@Inject(ExpoPushService) private readonly expoPushService: ExpoPushService) {
    super()
  }

  async process(job: Job<PushJob>) {
    this.logger.log(`Processing push job ${job.id}:${job.name}`)
    if (job.data.type === 'tokens') {
      await this.expoPushService.sendToTokens(job.data.payload)
      return
    }
    await this.expoPushService.sendSystemNotification(job.data.payload)
  }
}
