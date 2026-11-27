import { Module } from '@nestjs/common'
import { CourseService } from './course.service'
import { OrganizationCoursePeopleController } from './organization-course-people.controller'
import { OrganizationCoursesController } from './organization-courses.controller'

@Module({
  controllers: [OrganizationCoursesController, OrganizationCoursePeopleController],
  providers: [CourseService],
})
export class CourseModule {}