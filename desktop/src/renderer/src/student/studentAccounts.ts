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
        if (account.history.some((item) => item.date === entry.date)) return account
        return { ...account, history: [entry, ...account.history] }
      })
    }))
  }
}))

// Sin sesión se muestra la alumna de ejemplo (así abre `--dashboard`).
// Con una sesión que no es de alumno, o sin cuenta para ese correo, devuelve null:
// nunca se enseñan ni se escriben los datos de otra persona.
export function useCurrentStudent(): StudentAccount | null {
  const profile = useSessionStore((state) => state.profile)
  const email = useSessionStore((state) => state.email)
  const accounts = useStudentAccountsStore((state) => state.accounts)
  if (profile === null) {
    const wanted = normalizeEmail(exampleStudent.email)
    return accounts.find((account) => normalizeEmail(account.email) === wanted) ?? null
  }
  if (profile !== 'student' || email === null) {
    return null
  }
  const wanted = normalizeEmail(email)
  return accounts.find((account) => normalizeEmail(account.email) === wanted) ?? null
}
