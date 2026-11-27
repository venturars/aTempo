import { Inject, Injectable } from '@nestjs/common'
import type { Sdk } from 'atempo-sdk'
import { unwrapSdk } from '../contract/map-app-error'
import { toPersonJson, PersonResponseDto } from '../person/person-response.dto'
import { ATEMPO_SDK } from '../shared/atempo-sdk.token'
import { CreateCourseDto } from './create-course.dto'
import { CourseResponseDto, toCourseJson } from './course-response.dto'
import { EnrollPersonDto } from './enroll-person.dto'

@Injectable()
export class CourseService {
  constructor(@Inject(ATEMPO_SDK) private readonly sdk: Sdk) {}

  async create(
    organizationId: string,
    body: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    return toCourseJson(
      unwrapSdk(
        await this.sdk.createCourse({
          organizationId,
          name: body.name,
          acronym: body.acronym,
          startAt: body.start_at,
          endAt: body.end_at,
          contractAddress: body.contract_address,
        }),
      ),
    )
  }

  async enroll(
    organizationId: string,
    courseId: string,
    body: EnrollPersonDto,
  ): Promise<void> {
    unwrapSdk(
      await this.sdk.enrollPersonInCourse({
        organizationId,
        courseId,
        personId: body.person_id,
      }),
    )
  }

  async listPeople(
    organizationId: string,
    courseId: string,
  ): Promise<PersonResponseDto[]> {
    return unwrapSdk(
      await this.sdk.listCoursePeople({ organizationId, courseId }),
    ).map(toPersonJson)
  }

  async unenroll(
    organizationId: string,
    courseId: string,
    personId: string,
  ): Promise<void> {
    unwrapSdk(
      await this.sdk.unenrollPersonFromCourse({
        organizationId,
        courseId,
        personId,
      }),
    )
  }
}