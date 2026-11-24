// La organización invita a profesores y alumnos; no hay registro abierto.
// El correo de invitación lleva un enlace con el código. Sin backend, las invitaciones de ejemplo viven aquí.
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

export function findInvitation(code: string): Invitation | undefined {
  return invitations.find((invitation) => invitation.code === code.trim())
}
