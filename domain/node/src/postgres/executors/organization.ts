import type {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
} from '../../types/organization'
import {
  DELETE_ORGANIZATION,
  DELETE_ORGANIZATION_COURSES,
  DELETE_ORGANIZATION_ENROLLMENTS,
  FIND_ORGANIZATION_ID_BY_TAX_ID,
  GET_ORGANIZATION_BY_ID,
  INSERT_ORGANIZATION,
  LIST_ORGANIZATIONS,
  UPDATE_ORGANIZATION,
} from '../queries/organization'
import { query, type PostgresQuery } from '../pool'
import type { IdRow } from './id-row'

export async function retrieveAllOrganizations(
  run: PostgresQuery = query,
): Promise<Organization[]> {
  const result = await run(LIST_ORGANIZATIONS)
  return result.rows as Organization[]
}

export async function findOrganizationById(
  id: string,
  run: PostgresQuery = query,
): Promise<Organization | null> {
  const result = await run(GET_ORGANIZATION_BY_ID, [id])
  return (result.rows[0] as Organization | undefined) ?? null
}

export async function findOrganizationIdByTaxId(
  taxId: string,
  run: PostgresQuery = query,
): Promise<string | null> {
  const result = await run(FIND_ORGANIZATION_ID_BY_TAX_ID, [taxId])
  const row = result.rows[0] as IdRow | undefined
  return row?.id ?? null
}

export async function addOrganization(
  organization: OrganizationCreate,
  run: PostgresQuery = query,
): Promise<Organization | null> {
  const result = await run(INSERT_ORGANIZATION, [
    organization.name,
    organization.tax_id,
  ])
  return (result.rows[0] as Organization | undefined) ?? null
}

export async function insertOrganizationRow(
  organization: OrganizationUpdate,
  run: PostgresQuery = query,
): Promise<Organization | null> {
  const result = await run(UPDATE_ORGANIZATION, [
    organization.id,
    organization.name,
    organization.tax_id,
  ])
  return (result.rows[0] as Organization | undefined) ?? null
}

export async function removeOrganizationEnrollments(
  id: string,
  run: PostgresQuery = query,
): Promise<void> {
  await run(DELETE_ORGANIZATION_ENROLLMENTS, [id])
}

export async function removeOrganizationCourses(
  id: string,
  run: PostgresQuery = query,
): Promise<void> {
  await run(DELETE_ORGANIZATION_COURSES, [id])
}

export async function removeOrganizationById(
  id: string,
  run: PostgresQuery = query,
): Promise<boolean> {
  const result = await run(DELETE_ORGANIZATION, [id])
  return (result.rowCount ?? 0) > 0
}
