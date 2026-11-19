import { Module } from '@nestjs/common'
import { PostgresModule } from '../postgres/postgres.module'
import { PersonRoleController } from './person-role.controller'
import { PersonRoleService } from './person-role.service'

@Module({
  imports: [PostgresModule],
  controllers: [PersonRoleController],
  providers: [PersonRoleService],
})
export class PersonRoleModule {}