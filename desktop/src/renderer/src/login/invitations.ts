import { normalizeEmail } from '../student/studentAccounts'

// La organización invita a profesores y alumnos; no hay registro abierto.
// Sin backend, las invitaciones de ejemplo viven aquí.
export type Invitation = {
  name: string
  email: string
  code: string
  profile: 'teacher' | 'student'
}

export const invitations: Invitation[] = [
  { name: 'Lucía Martín', email: 'lucia.martin@atempo.test', code: '731905', profile: 'teacher' },
  { name: 'Bruno Sanz', email: 'bruno.sanz@clase.test', code: '264018', profile: 'student' }
]

export function findInvitation(email: string, code: string): Invitation | undefined {
  const wanted = normalizeEmail(email)
  return invitations.find(
    (invitation) => invitation.email === wanted && invitation.code === code.trim()
  )
}
