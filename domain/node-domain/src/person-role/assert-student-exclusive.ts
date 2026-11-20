import { listRolesByPerson } from '../role/list-roles-by-person'
import type { RoleName } from '../types/role'

export async function assertStudentExclusive(
  personId: string,
  newRole: RoleName,
): Promise<void> {
  const roles = await listRolesByPerson(personId)
  const names = roles.map((role) => role.name)

  if (newRole === 'student' && names.some((name) => name !== 'student')) {
    throw new Error('un student no puede llevar otro rol')
  }

  if (newRole !== 'student' && names.includes('student')) {
    throw new Error('un student no puede llevar otro rol')
  }
}
