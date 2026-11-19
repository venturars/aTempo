import { Injectable } from '@nestjs/common'
import { PostgresService } from '../postgres/postgres.service'
import { OrganizationResponseDto } from './organization-response.dto'

@Injectable()
export class OrganizationService {
  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<OrganizationResponseDto[]> {
    return this.postgres.listOrganizations()
  }
}
