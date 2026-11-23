import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'

// La SDK (lógica de negocio) vivirá en sdk/ (paquete hermano; carpeta pendiente).

@Module({
  imports: [HealthModule, AuthModule]
})
export class AppModule {}
