import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'

// La SDK (lógica de negocio) vivirá en sdk/ y hablará con este servicio.
// El API-router no llama a PostgreSQL.

@Module({
  imports: [HealthModule]
})
export class AppModule {}
