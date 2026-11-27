import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'
import { PersonRole } from './person-role'

export function assertRoleSet(roles: readonly PersonRole[]): Result<void> {
  const unique = [...new Set(roles)]
  if (unique.includes('student') && unique.length > 1) {
    return err(
      new AppError('VALIDATION', 'Un alumno no puede llevar otro rol.'),
    )
  }
  if (unique.filter((role) => role === 'organization_admin').length > 1) {
    return err(
      new AppError(
        'VALIDATION',
        'Una persona no puede repetir el rol de administrador.',
      ),
    )
  }
  return ok(undefined)
}

export function isOrganizationAdmin(roles: readonly PersonRole[]): boolean {
  return roles.includes('organization_admin')
}

export function isTeacher(roles: readonly PersonRole[]): boolean {
  return roles.includes('teacher')
}

export function isStudent(roles: readonly PersonRole[]): boolean {
  return roles.includes('student')
}
