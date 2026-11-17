import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import {
  exampleStudent,
  lateMinutes,
  normalizeEmail,
  todayClass,
  type ClassEntry,
  type StudentAccount
} from './studentExample'
import { clockTime, statusForArrival, statusLabel } from './attendanceStatus'

const accountsKey = 'atempo-student-accounts'

type StudentAccountsState = {
  accounts: StudentAccount[]
  findByEmail: (email: string) => StudentAccount | undefined
  addAccount: (name: string, email: string, password: string) => StudentAccount
  recordEntry: (email: string, entry: ClassEntry) => void
}

function copyExample(): StudentAccount {
  return { ...exampleStudent, history: exampleStudent.history.map((entry) => ({ ...entry })) }
}

function readAccounts(): StudentAccount[] {
  if (typeof sessionStorage === 'undefined') return [copyExample()]
  const raw = sessionStorage.getItem(accountsKey)
  if (raw === null) return [copyExample()]
  try {
    const parsed = JSON.parse(raw) as StudentAccount[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [copyExample()]
    return parsed
  } catch {
    return [copyExample()]
  }
}

function saveAccounts(accounts: StudentAccount[]): void {
  sessionStorage.setItem(accountsKey, JSON.stringify(accounts))
}

export const useStudentAccountsStore = create<StudentAccountsState>((set, get) => ({
  accounts: readAccounts(),
  findByEmail: (email) => {
    const wanted = normalizeEmail(email)
    return get().accounts.find((account) => normalizeEmail(account.email) === wanted)
  },
  addAccount: (name, email, password) => {
    const account: StudentAccount = {
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      history: []
    }
    const accounts = [...get().accounts, account]
    saveAccounts(accounts)
    set({ accounts })
    return account
  },
  recordEntry: (email, entry) => {
    const wanted = normalizeEmail(email)
    const accounts = get().accounts.map((account) => {
      if (normalizeEmail(account.email) !== wanted) return account
      if (account.history.some((item) => item.label === entry.label)) return account
      return { ...account, history: [entry, ...account.history] }
    })
    saveAccounts(accounts)
    set({ accounts })
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

export function registerReading(payload: string, now = new Date()): string {
  const value = payload.trim()
  if (value === '' || /^https?:/i.test(value)) return 'Este código no es de esta clase.'
  if (value !== todayClass.code && value !== todayClass.pin) {
    return 'Este código no es de esta clase.'
  }

  const email = useSessionStore.getState().email ?? exampleStudent.email
  const account = useStudentAccountsStore.getState().findByEmail(email)
  const previous = account?.history.find((entry) => entry.label === todayClass.label)
  if (previous) return `Ya registraste tu entrada a las ${previous.arrival ?? '—'}.`

  const arrival = clockTime(now)
  const status = statusForArrival(arrival, todayClass.start, lateMinutes)
  useStudentAccountsStore.getState().recordEntry(email, {
    label: todayClass.label,
    arrival,
    status
  })
  return `${statusLabel[status]} · ${arrival}`
}
