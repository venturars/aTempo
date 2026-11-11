export type RegisterErrors = {
  name: string
  email: string
  password: string
  repeatPassword: string
}

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister(
  name: string,
  email: string,
  password: string,
  repeatPassword: string
): RegisterErrors {
  const errors: RegisterErrors = {
    name: '',
    email: '',
    password: '',
    repeatPassword: ''
  }

  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  if (trimmedName === '') {
    errors.name = 'El nombre es obligatorio.'
  }

  if (trimmedEmail === '') {
    errors.email = 'El correo es obligatorio.'
  } else if (!emailShape.test(trimmedEmail)) {
    errors.email = 'El correo no tiene una forma válida.'
  }

  if (password === '') {
    errors.password = 'La contraseña es obligatoria.'
  } else if (password.length < 8) {
    errors.password = 'La contraseña tiene que tener al menos 8 caracteres.'
  }

  if (repeatPassword === '') {
    errors.repeatPassword = 'Repetir la contraseña es obligatorio.'
  } else if (repeatPassword !== password) {
    errors.repeatPassword = 'Las contraseñas no coinciden.'
  }

  return errors
}
