import { Inject, Injectable } from '@nestjs/common'
import type { Sdk } from 'atempo-sdk'
import { unwrapSdk } from '../contract/map-app-error'
import { ATEMPO_SDK } from '../shared/atempo-sdk.token'
import { InvitePersonDto } from './invite-person.dto'
import { PatchPersonDto } from './patch-person.dto'
import { PersonResponseDto, toPersonJson } from './person-response.dto'

@Injectable()
export class PersonService {
  constructor(@Inject(ATEMPO_SDK) private readonly sdk: Sdk) {}

  async invite(
    organizationId: string,
    body: InvitePersonDto,
  ): Promise<PersonResponseDto> {
    return toPersonJson(
      unwrapSdk(
        await this.sdk.invitePerson({
          organizationId,
          firstName: body.first_name,
          lastName: body.last_name,
          identificationDocument: body.identification_document,
          email: body.email,
          birthDate: body.birth_date,
          phone: body.phone,
          role: body.role,
        }),
      ),
    )
  }

  async list(organizationId: string): Promise<PersonResponseDto[]> {
    return unwrapSdk(await this.sdk.listPeople({ organizationId })).map(
      toPersonJson,
    )
  }

  async get(personId: string): Promise<PersonResponseDto> {
    return toPersonJson(unwrapSdk(await this.sdk.getPerson({ personId })))
  }

  async patch(personId: string, body: PatchPersonDto): Promise<PersonResponseDto> {
    return toPersonJson(
      unwrapSdk(
        await this.sdk.patchPerson({
          personId,
          firstName: body.first_name,
          lastName: body.last_name,
          identificationDocument: body.identification_document,
          email: body.email,
          birthDate: body.birth_date,
          phone: body.phone,
          roles: body.roles,
        }),
      ),
    )
  }

  async remove(personId: string): Promise<void> {
    unwrapSdk(await this.sdk.deletePerson({ personId }))
  }
}
