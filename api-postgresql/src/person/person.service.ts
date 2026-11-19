import { Injectable } from '@nestjs/common'
import { PostgresService } from '../postgres/postgres.service'
import { PersonResponseDto } from './person-response.dto'

@Injectable()
export class PersonService {
  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<PersonResponseDto[]> {
    return this.postgres.listPersons()
  }

  async findById(id: string): Promise<PersonResponseDto | null> {
    return this.postgres.findPersonById(id)
  }
}