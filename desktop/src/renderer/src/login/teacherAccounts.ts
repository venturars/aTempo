import { create } from 'zustand'
import { normalizeEmail } from '../student/studentAccounts'
import { teacherDemoAccount } from './teacherDemoAccount'

export type TeacherAccount = {
  name: string
  email: string
  password: string
}

type TeacherAccountsState = {
  accounts: TeacherAccount[]
  findByEmail: (email: string) => TeacherAccount | undefined
  addAccount: (name: string, email: string, password: string) => TeacherAccount
}

// Sin backend, las cuentas de profesor viven en memoria: la de ejemplo y las invitaciones activadas.
export const useTeacherAccountsStore = create<TeacherAccountsState>((set, get) => ({
  accounts: [teacherDemoAccount],
  findByEmail: (email) => {
    const wanted = normalizeEmail(email)
    return get().accounts.find((account) => normalizeEmail(account.email) === wanted)
  },
  addAccount: (name, email, password) => {
    const account: TeacherAccount = { name, email: normalizeEmail(email), password }
    set((state) => ({ accounts: [...state.accounts, account] }))
    return account
  }
}))
