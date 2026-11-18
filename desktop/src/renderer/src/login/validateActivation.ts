export type ActivationErrors = {
  email: string
  code: string
  password: string
}

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateActivation(
  email: string,
  code: string,
  password: string
): ActivationErrors {
  const errors: ActivationErrors = {
    email: '',
    code: '',
    password: ''
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail === '') {
    errors.email = 'El correo es obligatorio.'
  } else if (!emailShape.test(trimmedEmail)) {
    errors.email = 'El correo no tiene una forma válida.'
  }

  if (code.trim() === '') {
    errors.code = 'El código es obligatorio.'
  }

  if (password === '') {
    errors.password = 'La contraseña es obligatoria.'
  } else if (password.length < 8) {
    errors.password = 'La contraseña tiene que tener al menos 8 caracteres.'
  }

  return errors
}
