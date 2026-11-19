import type { QueryResult, QueryResultRow } from 'pg'
import { resetDb, substituteQuery, type QueryFn } from '../src/postgres/db'

export const PERSON_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
export const ORG_ID = '11111111-1111-1111-1111-111111111111'
export const COURSE_ID = '22222222-2222-2222-2222-222222222222'
export const OTHER_ID = '33333333-3333-3333-3333-333333333333'

export const validPerson = {
  id: PERSON_ID,
  identification_document: '99999999Z',
  email: 'demo@atempo.local',
  first_name: 'Demo',
  last_name: 'User',
  birth_date: null,
  phone: null,
}

export const validOrganization = {
  id: ORG_ID,
  name: 'Acme',
  tax_id: 'B12345678',
}

export const validCourse = {
  id: COURSE_ID,
  organization_id: ORG_ID,
  name: 'Primero',
  acronym: '1A',
  start_at: '2026-09-01T08:00:00.000Z',
  end_at: '2027-06-30T17:00:00.000Z',
  contract_address: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
}

export const validPersonCourse = {
  person_id: PERSON_ID,
  course_id: COURSE_ID,
}

export const validPersonRole = {
  person_id: PERSON_ID,
  role: 'teacher' as const,
}

export function emptyResult(): QueryResult<QueryResultRow> {
  return {
    rows: [],
    rowCount: 0,
    command: 'SELECT',
    oid: 0,
    fields: [],
  }
}

export function rowsResult(
  rows: QueryResultRow[],
): QueryResult<QueryResultRow> {
  return {
    rows,
    rowCount: rows.length,
    command: 'SELECT',
    oid: 0,
    fields: [],
  }
}

export function commandResult(rowCount: number): QueryResult<QueryResultRow> {
  return {
    rows: [],
    rowCount,
    command: 'DELETE',
    oid: 0,
    fields: [],
  }
}

export function mockDriver(
  impl?: QueryFn,
): { sql: string; params: unknown[] }[] {
  const calls: { sql: string; params: unknown[] }[] = []
  const fallback: QueryFn = async () => emptyResult()
  const run = impl ?? fallback

  substituteQuery(async (sql, params = []) => {
    calls.push({ sql, params })
    return run(sql, params)
  })

  return calls
}

export function resetDriver(): void {
  resetDb()
  delete process.env.DATABASE_URL
}
