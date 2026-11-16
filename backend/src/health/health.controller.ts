import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Confirma que la API está atendiendo peticiones.
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
