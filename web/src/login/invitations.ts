// La organización invita a los alumnos; no hay registro abierto.
// La invitación lleva lo que pone quien invita: nombre, apellidos y correo. El alumno completa el resto al activarla.
// Sin backend, las invitaciones de ejemplo viven aquí, con el mismo alumno que el escritorio
// (desktop/src/renderer/src/login/invitations.ts).
export type Invitation = {
  firstName: string
  lastName: string
  email: string
  code: string
}

export const invitations: Invitation[] = [
  { firstName: 'Bruno', lastName: 'Sanz', email: 'bruno.sanz@clase.test', code: '264018' }
]

export function findInvitation(code: string): Invitation | undefined {
  return invitations.find((invitation) => invitation.code === code.trim())
}
