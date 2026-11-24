export type ActivationForm = {
  firstName: string
  lastName: string
  identificationDocument: string
  password: string
}

export type ActivationErrors = Record<keyof ActivationForm, string>

// El documento se guarda sin espacios y en mayúsculas: 12345678z y 12345678Z son el mismo.
export function normalizeDocument(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase()
}

export function validateActivation(form: ActivationForm): ActivationErrors {
  return {
    firstName: form.firstName.trim() === '' ? 'El nombre es obligatorio.' : '',
    lastName: form.lastName.trim() === '' ? 'Los apellidos son obligatorios.' : '',
    identificationDocument:
      normalizeDocument(form.identificationDocument) === ''
        ? 'El documento de identidad es obligatorio.'
        : '',
    password:
      form.password === ''
        ? 'La contraseña es obligatoria.'
        : form.password.length < 8
          ? 'La contraseña tiene que tener al menos 8 caracteres.'
          : ''
  }
}

export function hasErrors(errors: ActivationErrors): boolean {
  return Object.values(errors).some((error) => error !== '')
}
