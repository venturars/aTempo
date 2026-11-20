import { Module } from '@nestjs/common'
import { PostgresModule } from '../postgres/postgres.module'
import { PersonCourseController } from './person-course.controller'
import { PersonCourseService } from './person-course.service'

@Module({
  imports: [PostgresModule],
  controllers: [PersonCourseController],
  providers: [PersonCourseService],
})
export class PersonCourseModule {}
