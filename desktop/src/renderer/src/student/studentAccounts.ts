import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { exampleStudent, type ClassEntry, type StudentAccount } from './studentExample'

type StudentAccountsState = {
  accounts: StudentAccount[]
  findByEmail: (email: string) => StudentAccount | undefined
  addAccount: (name: string, email: string, password: string) => StudentAccount
  recordEntry: (email: string, entry: ClassEntry) => void
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const useStudentAccountsStore = create<StudentAccountsState>((set, get) => ({
  accounts: [exampleStudent],
  findByEmail: (email) => {
    const wanted = normalizeEmail(email)
    return get().accounts.find((account) => normalizeEmail(account.email) === wanted)
  },
  addAccount: (name, email, password) => {
    const account: StudentAccount = {
      name: name.trim(),
      email: email.trim(),
      password,
      history: []
    }
    set((state) => ({ accounts: [...state.accounts, account] }))
    return account
  },
  recordEntry: (email, entry) => {
    const wanted = normalizeEmail(email)
    set((state) => ({
      accounts: state.accounts.map((account) => {
        if (normalizeEmail(account.email) !== wanted) return account
        if (account.history.some((item) => item.label === entry.label)) return account
        return { ...account, history: [entry, ...account.history] }
      })
    }))
  }
}))

export function useCurrentStudent(): StudentAccount {
  const email = useSessionStore((state) => state.email)
  const accounts = useStudentAccountsStore((state) => state.accounts)
  const wanted = normalizeEmail(email ?? exampleStudent.email)
  return (
    accounts.find((account) => normalizeEmail(account.email) === wanted) ??
    accounts.find(
      (account) => normalizeEmail(account.email) === normalizeEmail(exampleStudent.email)
    ) ??
    accounts[0]
  )
}
