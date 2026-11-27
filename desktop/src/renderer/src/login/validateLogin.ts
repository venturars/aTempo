import type { TextKey } from '../lang/messages'

export type LoginErrors = {
  email: TextKey | ''
  password: TextKey | ''
}

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {
    email: '',
    password: ''
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail === '') {
    errors.email = 'login.errors.emailRequired'
  } else if (!emailShape.test(trimmedEmail)) {
    errors.email = 'login.errors.emailInvalid'
  }

  if (password === '') {
    errors.password = 'login.errors.passwordRequired'
  }

  return errors
}
