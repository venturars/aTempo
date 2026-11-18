import { Module } from '@nestjs/common'
import { PostgresModule } from '../postgres/postgres.module'
import { PersonController } from './person.controller'
import { PersonService } from './person.service'

@Module({
  imports: [PostgresModule],
  controllers: [PersonController],
  providers: [PersonService],
})
export class PersonModule {}