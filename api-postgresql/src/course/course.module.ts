import { Module } from '@nestjs/common'
import { PostgresModule } from '../postgres/postgres.module'
import { CourseController } from './course.controller'
import { CourseService } from './course.service'

@Module({
  imports: [PostgresModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
