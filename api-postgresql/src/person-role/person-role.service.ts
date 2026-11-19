import { Injectable } from '@nestjs/common'
import { PostgresService } from '../postgres/postgres.service'
import { PersonRoleResponseDto } from './person-role-response.dto'

@Injectable()
export class PersonRoleService {
  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<PersonRoleResponseDto[]> {
    return this.postgres.listPersonRoles()
  }
}