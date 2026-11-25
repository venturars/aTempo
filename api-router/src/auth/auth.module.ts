import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { WebSessionService } from './web-session.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, WebSessionService]
})
export class AuthModule {}
