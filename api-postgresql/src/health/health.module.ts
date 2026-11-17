import { Module } from '@nestjs/common'
import { PostgresModule } from '../postgres/postgres.module'
import { HealthController } from './health.controller'

@Module({
  imports: [PostgresModule],
  controllers: [HealthController],
})
export class HealthModule {}
