import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { PersonRoleModule } from './person-role/person-role.module'

// La SDK (lógica de negocio) vivirá en sdk/ y hablará con este servicio.
// El API-router no llama a PostgreSQL.

@Module({
  imports: [HealthModule, PersonRoleModule],
})
export class AppModule {}
