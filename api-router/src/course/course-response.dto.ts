import { ApiProperty } from '@nestjs/swagger'
import type { Course } from 'atempo-sdk'

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  organization_id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  acronym!: string

  @ApiProperty({ type: String, format: 'date-time' })
  start_at!: string

  @ApiProperty({ type: String, format: 'date-time' })
  end_at!: string

  @ApiProperty()
  contract_address!: string
}

export function toCourseJson(course: Course): CourseResponseDto {
  return {
    id: course.id,
    organization_id: course.organizationId,
    name: course.name,
    acronym: course.acronym,
    start_at: course.startAt,
    end_at: course.endAt,
    contract_address: course.contractAddress,
  }
}