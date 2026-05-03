import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { SharedNestModule } from 'modules/shared/common.module'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './jwt.strategy'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [
    SharedNestModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret') || 'HJ9DUD@7HSI1Dej3hfefH&Ejk2'
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, PassportModule]
})
export class AuthModule {}
