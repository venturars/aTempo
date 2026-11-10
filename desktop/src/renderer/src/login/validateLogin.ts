export type LoginErrors = {
  email: string
  password: string
}

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {
    email: '',
    password: ''
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail === '') {
    errors.email = 'El correo es obligatorio.'
  } else if (!emailShape.test(trimmedEmail)) {
    errors.email = 'El correo no tiene una forma válida.'
  }

  if (password === '') {
    errors.password = 'La contraseña es obligatoria.'
  }

  return errors
}
