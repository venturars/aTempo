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
import { PersonRoleResponseDto } from './person-role-response.dto'
import { PersonRoleService } from './person-role.service'

@ApiTags('person-role')
@Controller('person-role')
export class PersonRoleController {
  constructor(private readonly personRoleService: PersonRoleService) {}

  @Get()
  @ApiOkResponse({ type: PersonRoleResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async listPersonRoles(): Promise<PersonRoleResponseDto[]> {
    try {
      return await this.personRoleService.listAll()
    } catch {
      throw new ServiceUnavailableException()
    }
  }
}