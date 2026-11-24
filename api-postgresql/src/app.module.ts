import { Module } from '@nestjs/common'
import { CourseModule } from './course/course.module'
import { HealthModule } from './health/health.module'
import { OrganizationModule } from './organization/organization.module'
import { PersonCourseModule } from './person-course/person-course.module'
import { PersonModule } from './person/person.module'
import { PersonRoleModule } from './person-role/person-role.module'

// La SDK (lógica de negocio) vivirá en sdk/ y hablará con este servicio.
// El API-router no llama a PostgreSQL.

@Module({
  imports: [
    HealthModule,
    OrganizationModule,
    PersonModule,
    CourseModule,
    PersonRoleModule,
    PersonCourseModule,
  ],
})
export class AppModule {}
