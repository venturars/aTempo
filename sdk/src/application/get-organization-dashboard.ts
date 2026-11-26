import type { DashboardFixture, OrganizationDashboard } from '../domain/organization-dashboard'
import { organizationDashboardFixture } from '../infrastructure/organization-dashboard-fixtures'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type GetOrganizationDashboardInput = {
  readonly fixture?: DashboardFixture
}

export function createGetOrganizationDashboard() {
  return async function getOrganizationDashboard(
    input: GetOrganizationDashboardInput = {},
  ): Promise<Result<OrganizationDashboard>> {
    const fixture = input.fixture ?? 'complete'
    if (!['complete', 'empty', 'incomplete'].includes(fixture)) {
      return err(
        new AppError(
          'VALIDATION',
          'El parámetro fixture debe ser complete, empty o incomplete.',
        ),
      )
    }
    return ok(organizationDashboardFixture(fixture))
  }
}