import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger'
import { PostgresService } from '../postgres/postgres.service'
import { HealthResponseDto } from './health-response.dto'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly postgres: PostgresService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async getHealth(): Promise<HealthResponseDto> {
    try {
      await this.postgres.check()
    } catch {
      throw new ServiceUnavailableException({ status: 'error', postgres: 'error' })
    }

    return { status: 'ok', postgres: 'ok' }
  }
}
