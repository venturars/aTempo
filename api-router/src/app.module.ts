import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'

// Tras Auth0, AuthService llama a sdk/ (atempo-sdk).

@Module({
  imports: [HealthModule, AuthModule]
})
export class AppModule {}
