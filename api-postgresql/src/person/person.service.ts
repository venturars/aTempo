import { Injectable } from '@nestjs/common'
import { PERSON_DEMO } from './person-demo'
import { PersonResponseDto } from './person-response.dto'

@Injectable()
export class PersonService {
  listAll(): PersonResponseDto[] {
    return PERSON_DEMO
  }
}