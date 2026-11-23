import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { MockApiModule } from './mock-api/mock-api.module'

// La SDK (lógica de negocio) vivirá en sdk/ (paquete hermano; carpeta pendiente).

@Module({
  imports: [
    HealthModule,
    ...(process.env.API_MOCK === 'true' ? [MockApiModule] : []),
  ],
})
export class AppModule {}
