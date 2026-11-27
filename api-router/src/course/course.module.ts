import { Module } from '@nestjs/common'
import { CourseService } from './course.service'
import { OrganizationCoursePeopleController } from './organization-course-people.controller'
import { OrganizationCourseStudentsController } from './organization-course-students.controller'
import { OrganizationCoursesController } from './organization-courses.controller'

@Module({
  controllers: [
    OrganizationCoursesController,
    OrganizationCoursePeopleController,
    OrganizationCourseStudentsController,
  ],
  providers: [CourseService],
})
export class CourseModule {}
