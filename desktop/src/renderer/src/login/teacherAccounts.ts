import { create } from 'zustand'
import { normalizeEmail } from '../student/studentAccounts'
import { teacherDemoAccount } from './teacherDemoAccount'
import { useSessionStore } from '../session/sessionStore'
import { validateActivation } from './validateActivation'

export type TeacherAccount = {
  name: string
  email: string
  password: string
}

type TeacherAccountsState = {
  accounts: TeacherAccount[]
  findByEmail: (email: string) => TeacherAccount | undefined
  changePassword: (current: string, next: string, confirmation: string) => string
  addAccount: (name: string, email: string, password: string) => TeacherAccount
}

// Sin backend, las cuentas de profesor viven en memoria: la de ejemplo y las invitaciones activadas.
export const useTeacherAccountsStore = create<TeacherAccountsState>((set, get) => ({
  accounts: [teacherDemoAccount],
  findByEmail: (email) => {
    const wanted = normalizeEmail(email)
    return get().accounts.find((account) => normalizeEmail(account.email) === wanted)
  },
  changePassword: (current, next, confirmation) => {
    const { profile, email } = useSessionStore.getState()
    const account = profile === 'teacher' && email !== null ? get().findByEmail(email) : undefined
    if (!account) return 'Entra con tu cuenta de profesor para cambiar la contraseña.'
    if (account.password !== current) return 'La contraseña actual no coincide.'
    const error = validateActivation(next)
    if (error) return error
    if (next === current) return 'Elige una contraseña distinta de la actual.'
    if (next !== confirmation) return 'Las contraseñas nuevas no coinciden.'
    set((state) => ({
      accounts: state.accounts.map((entry) =>
        entry === account ? { ...entry, password: next } : entry
      )
    }))
    return ''
  },
  addAccount: (name, email, password) => {
    const account: TeacherAccount = { name, email: normalizeEmail(email), password }
    set((state) => ({ accounts: [...state.accounts, account] }))
    return account
  }
}))
