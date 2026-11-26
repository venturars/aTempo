import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { MockApiModule } from './mock-api/mock-api.module'
import { OrganizationDashboardModule } from './organization-dashboard/organization-dashboard.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { SdkModule } from './sdk/sdk.module'

// AuthService llama a afterAuth de atempo-sdk tras login, register y me.
// OrganizationsModule traduce el CRUD HTTP y delega en la misma instancia de SDK.

@Module({
  imports: [
    SdkModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    OrganizationDashboardModule,
    ...(process.env.API_MOCK === 'true' ? [MockApiModule] : []),
  ],
})
export class AppModule {}
