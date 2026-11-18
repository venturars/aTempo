import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { PersonCourseModule } from './person-course/person-course.module'

// La SDK (lógica de negocio) vivirá en sdk/ y hablará con este servicio.
// El API-router no llama a PostgreSQL.

@Module({
  imports: [HealthModule, PersonCourseModule],
})
export class AppModule {}
