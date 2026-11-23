// La organización invita a los alumnos; no hay registro abierto.
// El correo de invitación lleva un enlace con el código. Sin backend, las invitaciones de ejemplo viven aquí,
// con los mismos datos que la del alumno del escritorio (desktop/src/renderer/src/login/invitations.ts).
export type Invitation = {
  name: string
  email: string
  code: string
}

export const invitations: Invitation[] = [
  { name: 'Bruno Sanz', email: 'bruno.sanz@clase.test', code: '264018' }
]

export function findInvitation(code: string): Invitation | undefined {
  return invitations.find((invitation) => invitation.code === code.trim())
}
