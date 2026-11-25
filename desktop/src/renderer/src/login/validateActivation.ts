// La contraseña nueva de una invitación tiene que tener 8 caracteres o más.
export function validateActivation(password: string): string {
  if (password === '') {
    return 'La contraseña es obligatoria.'
  }
  if (password.length < 8) {
    return 'La contraseña tiene que tener al menos 8 caracteres.'
  }
  return ''
}
