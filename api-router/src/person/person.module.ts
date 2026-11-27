import { Module } from '@nestjs/common'
import { OrganizationPeopleController } from './organization-people.controller'
import { PersonController } from './person.controller'
import { PersonService } from './person.service'

@Module({
  controllers: [OrganizationPeopleController, PersonController],
  providers: [PersonService],
})
export class PersonModule {}
