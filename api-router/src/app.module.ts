import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { MockApiModule } from './mock-api/mock-api.module'
import { OrganizationModule } from './organization/organization.module'
import { CourseModule } from './course/course.module'
import { PersonModule } from './person/person.module'
import { AtempoSdkModule } from './shared/atempo-sdk.module'

// AuthService llama a afterAuth de atempo-sdk tras login, register y me.
// OrganizationModule, PersonModule y CourseModule: controller → service → la misma instancia de SDK.

@Module({
  imports: [
    AtempoSdkModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    PersonModule,
    CourseModule,
    ...(process.env.API_MOCK === 'true' ? [MockApiModule] : []),
  ],
})
export class AppModule {}
