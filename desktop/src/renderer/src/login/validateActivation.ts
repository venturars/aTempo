import type { TextKey } from '../lang/messages'

// La contraseña nueva de una invitación tiene que tener 8 caracteres o más.
export function validateActivation(password: string): TextKey | '' {
  if (password === '') {
    return 'login.errors.passwordRequired'
  }
  if (password.length < 8) {
    return 'login.errors.passwordTooShort'
  }
  return ''
}
