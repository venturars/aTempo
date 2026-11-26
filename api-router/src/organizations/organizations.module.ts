import { Module } from '@nestjs/common'
import { OrganizationsController } from './organizations.controller'
import { PeopleController } from './people.controller'

@Module({
  controllers: [OrganizationsController, PeopleController],
})
export class OrganizationsModule {}
