export type RegisterErrors = {
  name: string
  email: string
  password: string
}

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8

export function validateRegister(name: string, email: string, password: string): RegisterErrors {
  const errors: RegisterErrors = {
    name: '',
    email: '',
    password: ''
  }

  if (name.trim() === '') {
    errors.name = 'El nombre es obligatorio.'
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail === '') {
    errors.email = 'El correo es obligatorio.'
  } else if (!emailShape.test(trimmedEmail)) {
    errors.email = 'El correo no tiene una forma válida.'
  }

  if (password === '') {
    errors.password = 'La contraseña es obligatoria.'
  } else if (password.length < minimumPasswordLength) {
    errors.password = 'La contraseña necesita 8 caracteres o más.'
  }

  return errors
}
