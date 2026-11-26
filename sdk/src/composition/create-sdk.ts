import { createAfterAuth } from '../application/after-auth'
import { createCreateOrganization } from '../application/create-organization'
import { createDeletePerson } from '../application/delete-person'
import { createGetOrganization } from '../application/get-organization'
import { createGetPerson } from '../application/get-person'
import { createInvitePerson } from '../application/invite-person'
import { createListPeople } from '../application/list-people'
import { createPatchOrganization } from '../application/patch-organization'
import { createPatchPerson } from '../application/patch-person'
import {
  AssignedCourseCount,
  zeroAssignedCourseCount,
} from '../domain/assigned-course-count'
import { OrganizationRepository } from '../domain/organization-repository'
import { InMemoryPersonRepository } from '../infrastructure/in-memory-person-repository'
import {
  createPostgresHealthClient,
  FetchLike,
} from '../infrastructure/postgres-health-client'

export type CreateSdkInput = {
  fetch?: FetchLike
  readPostgresApiUrl?: () => string | undefined
  persons?: InMemoryPersonRepository
  healthTimeoutMs?: number
  assignedCourseCount?: AssignedCourseCount
}

export function createSdk(input: CreateSdkInput = {}) {
  const persons = input.persons ?? new InMemoryPersonRepository()
  const organizations: OrganizationRepository = {
    findById: (organizationId) => persons.findOrganizationById(organizationId),
    findByTaxId: (taxId) => persons.findByTaxId(taxId),
    save: (organization) => persons.saveOrganization(organization),
  }
  const assignedCourseCount =
    input.assignedCourseCount ?? zeroAssignedCourseCount()
  const checkHealth = createPostgresHealthClient({
    fetch: input.fetch ?? globalThis.fetch.bind(globalThis),
    timeoutMs: input.healthTimeoutMs,
  })
  const afterAuth = createAfterAuth({
    readPostgresApiUrl:
      input.readPostgresApiUrl ?? (() => process.env.API_POSTGRESQL_URL),
    checkHealth,
    persons,
  })
  const directory = { organizations, persons }

  return {
    afterAuth,
    persons,
    createOrganization: createCreateOrganization(directory),
    getOrganization: createGetOrganization({ organizations }),
    patchOrganization: createPatchOrganization({ organizations }),
    invitePerson: createInvitePerson(directory),
    listPeople: createListPeople(directory),
    getPerson: createGetPerson({ persons }),
    patchPerson: createPatchPerson({ persons, assignedCourseCount }),
    deletePerson: createDeletePerson({ persons, assignedCourseCount }),
  }
}

export type Sdk = ReturnType<typeof createSdk>
