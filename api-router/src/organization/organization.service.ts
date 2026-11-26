import { Inject, Injectable } from '@nestjs/common'
import type { Sdk } from 'atempo-sdk'
import { unwrapSdk } from '../contract/map-app-error'
import { ATEMPO_SDK } from '../shared/atempo-sdk.token'
import { toPersonJson } from '../person/person-response.dto'
import { CreateOrganizationDto } from './create-organization.dto'
import {
  CreateOrganizationResponseDto,
  OrganizationResponseDto,
  toOrganizationJson,
} from './organization-response.dto'
import { PatchOrganizationDto } from './patch-organization.dto'

@Injectable()
export class OrganizationService {
  constructor(@Inject(ATEMPO_SDK) private readonly sdk: Sdk) {}

  async create(body: CreateOrganizationDto): Promise<CreateOrganizationResponseDto> {
    const value = unwrapSdk(
      await this.sdk.createOrganization({
        name: body.name,
        taxId: body.tax_id,
        firstName: body.first_name,
        lastName: body.last_name,
        identificationDocument: body.identification_document,
        email: body.email,
        birthDate: body.birth_date,
        phone: body.phone,
      }),
    )
    return {
      organization: toOrganizationJson(value.organization),
      person: toPersonJson(value.person),
    }
  }

  async get(organizationId: string): Promise<OrganizationResponseDto> {
    return toOrganizationJson(
      unwrapSdk(await this.sdk.getOrganization({ organizationId })),
    )
  }

  async patch(
    organizationId: string,
    body: PatchOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return toOrganizationJson(
      unwrapSdk(
        await this.sdk.patchOrganization({
          organizationId,
          name: body.name,
          taxId: body.tax_id,
        }),
      ),
    )
  }
}
