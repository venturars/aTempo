import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { OrganizationResponseDto } from './organization-response.dto'
import { OrganizationService } from './organization.service'

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async listOrganizations(): Promise<OrganizationResponseDto[]> {
    try {
      return await this.organizationService.listAll()
    } catch {
      // Mantiene el contrato HTTP cuando falla la consulta a PostgreSQL.
      throw new ServiceUnavailableException()
    }
  }
}
