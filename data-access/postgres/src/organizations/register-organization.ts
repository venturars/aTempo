import {
  ensureEmailAvailable,
  ensureIdentificationDocumentAvailable,
} from '../people/rules'
import { addOrganizationRow } from '../postgres/executors/organization'
import { addPersonRow } from '../postgres/executors/person'
import { addPersonRoleRow } from '../postgres/executors/person-role'
import { withTransaction } from '../postgres/pool'
import { personFromRow } from '../postgres/rows/person'
import {
  assertOrganization,
  assertOrganizationCreate,
} from '../shared/validation/organization'
import { assertPersonCreate, normalizeEmail } from '../shared/validation/person'
import type {
  Organization,
  OrganizationCreate,
} from '../shared/types/organization'
import type { Person, PersonCreate } from '../shared/types/person'
import { ensureTaxIdAvailable } from './rules'

export type RegisterOrganizationInput = {
  organization: OrganizationCreate
  admin: PersonCreate
}

export type RegisterOrganizationOutput = {
  organization: Organization
  admin: Person
}

/**
 * Registra una organización junto con su administrador: crea la organización,
 * la persona y su rol organization_admin en la misma transacción. Es la única
 * forma de que alguien sea organization_admin.
 */
export async function registerOrganization(
  input: RegisterOrganizationInput,
): Promise<RegisterOrganizationOutput> {
  const organization = assertOrganizationCreate(input.organization)
  const admin = assertPersonCreate(input.admin)
  const email = normalizeEmail(admin.email)

  return withTransaction(async (run) => {
    await ensureTaxIdAvailable({ taxId: organization.tax_id }, run)
    await ensureIdentificationDocumentAvailable(
      { identificationDocument: admin.identification_document },
      run,
    )
    await ensureEmailAvailable({ email }, run)

    const organizationRow = await addOrganizationRow(organization, run)
    const adminRow = await addPersonRow({ ...admin, email }, run)
    const created = personFromRow(adminRow)
    await addPersonRoleRow(
      { person_id: created.id, role: 'organization_admin' },
      run,
    )

    return {
      organization: assertOrganization(organizationRow),
      admin: created,
    }
  })
}
