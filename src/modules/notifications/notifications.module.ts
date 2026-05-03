import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConditionalModule, ConfigService } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { SharedNestModule } from 'modules/shared/common.module'
import { NotificationService } from './notification.service'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { ExpoPushService } from './push/send-notify'
import { PushProcessor } from './queue/push.processor'
import { PushQueueService } from './queue/push.queue'

const shouldUseBullMq = (env: NodeJS.ProcessEnv) => env.PUSH_QUEUE_DRIVER === 'bullmq' || !!env.REDIS_HOST

@Module({
  imports: [
    SharedNestModule,
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('app.expo.timeout') ?? 10_000,
        maxRedirects: 3
      })
    }),
    ConditionalModule.registerWhen(
      BullModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connection: {
            host: configService.get<string>('app.redis.host') || 'localhost',
            port: configService.get<number>('app.redis.port') ?? 6379,
            username: configService.get<string>('app.redis.username'),
            password: configService.get<string>('app.redis.password'),
            db: configService.get<number>('app.redis.db') ?? 0
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: 500,
            removeOnFail: 1_000
          }
        })
      }),
      shouldUseBullMq
    ),
    ConditionalModule.registerWhen(BullModule.registerQueue({ name: 'push-notifications' }), shouldUseBullMq)
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationService, ExpoPushService, PushQueueService, PushProcessor],
  exports: [NotificationService, ExpoPushService, PushQueueService]
})
export class NotificationsModule {}
