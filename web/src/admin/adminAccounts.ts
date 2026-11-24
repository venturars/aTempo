import { create } from 'zustand'
import { useAdminStore, type AdminData, type MutationResult, type Person } from './adminStore'

// Simula POST /auth/register y POST /auth/login del contrato v1 (#90) mientras no exista la API.
// Las cuentas y las organizaciones creadas viven en memoria y se pierden al recargar.

type AdminAccount = { email: string; password: string; organizationId: string; personId: string }
type OrganizationData = Pick<AdminData, 'organization' | 'people' | 'courses' | 'sessions'>

export type SignUpInput = {
  organizationName: string
  taxId: string
  firstName: string
  lastName: string
  identificationDocument: string
  email: string
  password: string
}
export type SignUpErrors = Partial<Record<keyof SignUpInput, string>>

export const demoAdminEmail = 'miguel@neoland.example'
export const demoAdminPassword = 'neoland-2026'
export const loginErrorText = 'El correo o la contraseña no coinciden.'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const compact = (value: string): string => value.replace(/[\s.-]/g, '').toUpperCase()

type AccountsState = {
  accounts: AdminAccount[]
  // Datos de las organizaciones que no están abiertas, para volver a ellas al entrar.
  stored: Record<string, OrganizationData>
  logIn: (email: string, password: string) => MutationResult<Person>
  signUp: (input: SignUpInput) => { ok: true; value: Person } | { ok: false; errors: SignUpErrors }
}

function knownOrganizations(stored: Record<string, OrganizationData>): OrganizationData[] {
  const { organization, people, courses, sessions } = useAdminStore.getState()
  return [{ organization, people, courses, sessions }, ...Object.values(stored)].filter(
    (data, index, all) =>
      all.findIndex((entry) => entry.organization.id === data.organization.id) === index
  )
}

function openOrganization(
  stored: Record<string, OrganizationData>,
  next: OrganizationData
): Record<string, OrganizationData> {
  const { organization, people, courses, sessions } = useAdminStore.getState()
  const remaining = { ...stored, [organization.id]: { organization, people, courses, sessions } }
  delete remaining[next.organization.id]
  useAdminStore.setState({ ...next, currentPersonId: null })
  return remaining
}

export const useAdminAccounts = create<AccountsState>((set, get) => ({
  accounts: [
    {
      email: demoAdminEmail,
      password: demoAdminPassword,
      organizationId: 'org-neoland',
      personId: 'person-admin'
    }
  ],
  stored: {},
  logIn: (email, password) => {
    const account = get().accounts.find(
      (entry) => entry.email === email.trim().toLowerCase() && entry.password === password
    )
    if (!account) return { ok: false, error: loginErrorText }
    if (useAdminStore.getState().organization.id !== account.organizationId) {
      const data = get().stored[account.organizationId]
      if (data) set({ stored: openOrganization(get().stored, data) })
      else useAdminStore.getState().resetDemo()
    }
    const person = useAdminStore.getState().people.find((entry) => entry.id === account.personId)
    if (!person || person.state !== 'active' || !person.roles.includes('admin'))
      return { ok: false, error: loginErrorText }
    useAdminStore.setState({ currentPersonId: person.id })
    return { ok: true, value: person }
  },
  signUp: (input) => {
    const organizationName = input.organizationName.trim()
    const taxId = compact(input.taxId)
    const firstName = input.firstName.trim()
    const lastName = input.lastName.trim()
    const identificationDocument = compact(input.identificationDocument)
    const email = input.email.trim().toLowerCase()
    const organizations = knownOrganizations(get().stored)
    const people = organizations.flatMap((data) => data.people)

    const errors: SignUpErrors = {}
    if (!organizationName) errors.organizationName = 'Escribe el nombre de la organización.'
    if (!/^[A-Z0-9]{9}$/.test(taxId)) errors.taxId = 'Escribe un CIF de 9 caracteres.'
    else if (organizations.some((data) => data.organization.taxId === taxId))
      errors.taxId = 'Ya hay una organización con este CIF.'
    if (!firstName) errors.firstName = 'Escribe tu nombre.'
    if (!lastName) errors.lastName = 'Escribe tus apellidos.'
    if (!/^[A-Z0-9]{5,20}$/.test(identificationDocument))
      errors.identificationDocument = 'Escribe un DNI, NIE o pasaporte válido.'
    else if (people.some((person) => person.identificationDocument === identificationDocument))
      errors.identificationDocument = 'Ya hay una cuenta con este documento.'
    if (!emailPattern.test(email)) errors.email = 'Escribe un correo válido.'
    else if (
      get().accounts.some((account) => account.email === email) ||
      people.some((person) => person.email.toLowerCase() === email)
    )
      errors.email = 'Ya hay una cuenta con este correo.'
    if (input.password.length < 8) errors.password = 'Usa al menos 8 caracteres.'
    if (Object.keys(errors).length > 0) return { ok: false, errors }

    const number = organizations.length + 1
    const organizationId = `org-${number}`
    const admin: Person = {
      id: `person-admin-${number}`,
      organizationId,
      name: `${firstName} ${lastName}`,
      email,
      roles: ['admin'],
      state: 'active',
      identificationDocument
    }
    const stored = openOrganization(get().stored, {
      organization: { id: organizationId, name: organizationName, taxId },
      people: [admin],
      courses: [],
      sessions: []
    })
    set({
      stored,
      accounts: [
        ...get().accounts,
        { email, password: input.password, organizationId, personId: admin.id }
      ]
    })
    useAdminStore.setState({ currentPersonId: admin.id })
    return { ok: true, value: admin }
  }
}))
