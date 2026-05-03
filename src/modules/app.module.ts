import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import type { MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import appConfig from 'config/app.config'
import { AccountsModule } from './accounts/accounts.module'
import { AuthModule } from './auth/auth.module'
import { ChatModule } from './chat/chat.module'
import { ContentModule } from './content/content.module'
import { DatabaseModule } from './database/database.module'
import { FilesModule } from './files/files.module'
import { MealPlanModule } from './meal-plan/meal-plan.module'
import { NotificationsModule } from './notifications/notifications.module'
import { OrganizationModule } from './organization/organization.module'
import { RequestContextMiddleware } from './shared/middleware/request-context.middleware'
import { SanitizeNoSqlInputMiddleware } from './shared/middleware/sanitize.middleware'
import { SecurityHeadersMiddleware } from './shared/middleware/security.middleware'
import { WorkoutModule } from './workout/workout.module'
import { RolesGuard } from './shared/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [appConfig]
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('app.cache.ttl') ?? 30_000,
        max: configService.get<number>('app.cache.max') ?? 500
      })
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.rateLimit.ttl') ?? 60_000,
          limit: configService.get<number>('app.rateLimit.limit') ?? 600
        }
      ]
    }),
    DatabaseModule,
    AuthModule,
    AccountsModule,
    ContentModule,
    FilesModule,
    OrganizationModule,
    WorkoutModule,
    MealPlanModule,
    ChatModule,
    NotificationsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware, SecurityHeadersMiddleware, SanitizeNoSqlInputMiddleware)
      .exclude('admin', 'admin/*path')
      .forRoutes('*')
  }
}
