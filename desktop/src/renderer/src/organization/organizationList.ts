export type OrganizationRow = Record<string, unknown>

export const organizationListUrl = 'http://127.0.0.1:3001/organization'

const organizationListUrls = [organizationListUrl, 'http://host.docker.internal:3001/organization']

const preferredColumns = ['id', 'name', 'tax_id']

export async function loadOrganizations(signal: AbortSignal): Promise<OrganizationRow[]> {
  let lastError: unknown

  for (const url of organizationListUrls) {
    try {
      return await readOrganizationList(url, signal)
    } catch (error) {
      if (signal.aborted || !isConnectionError(error)) throw error
      lastError = error
    }
  }

  throw new Error('No hay conexión con la API en el puerto 3001.', { cause: lastError })
}

async function readOrganizationList(url: string, signal: AbortSignal): Promise<OrganizationRow[]> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`La API respondió ${response.status}.`)
  }

  const body: unknown = await response.json()
  if (!Array.isArray(body) || body.some((row) => !isOrganizationRow(row))) {
    throw new Error('La API no devolvió una lista de organizaciones.')
  }

  return body
}

function isConnectionError(error: unknown): boolean {
  return error instanceof TypeError
}

export function organizationColumns(rows: OrganizationRow[]): string[] {
  const present = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) present.add(key)
  }

  const known = preferredColumns.filter((column) => present.has(column))
  const rest = [...present].filter((column) => !preferredColumns.includes(column)).sort()
  return [...known, ...rest]
}

export function organizationCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

function isOrganizationRow(value: unknown): value is OrganizationRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
