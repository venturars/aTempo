import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'

// La SDK (lógica de negocio) vivirá en sdk/ (paquete hermano; carpeta pendiente).

@Module({
  imports: [HealthModule]
})
export class AppModule {}