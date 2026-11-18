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
import { clockTime, statusForArrival } from './attendanceStatus'
import { isCodeValidNow, readClassCode } from './classCode'
import { formatDay } from './studentDate'

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

// Lo que pasa al leer el QR o escribir el código: o queda apuntada la entrada, o hay un aviso.
export type CheckInResult =
  { registered: true; arrival: string } | { registered: false; message: string }

const wrongCode = 'Ese código no es de esta clase. Revísalo y prueba otra vez.'
const codeNotValidNow = 'Ese código no vale ahora. Prueba con el que se ve en la pantalla de clase.'

function isClassDay(now: Date): boolean {
  return todayClass.weekdays.includes(now.getDay())
}

function minutesNow(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

function classIsOver(now: Date): boolean {
  const [hours = 0, minutes = 0] = todayClass.end.split(':').map(Number)
  return minutesNow(now) >= hours * 60 + minutes
}

// Comprueba lo leído del QR o lo escrito a mano. Devuelve el aviso si no vale, o null si vale.
export function classCodeProblem(payload: string, now: Date): string | null {
  const code = readClassCode(payload, todayClass.id)
  if (code === null) return wrongCode
  if (!isCodeValidNow(code, todayClass.id, now)) return codeNotValidNow
  return null
}

// Apunta la entrada de hoy con la hora `at`. Quien ya entró hoy no se apunta dos veces.
export function registerArrival(at: Date): CheckInResult {
  if (!isClassDay(at)) return { registered: false, message: 'Hoy no tienes clase.' }
  if (classIsOver(at)) return { registered: false, message: 'La clase de hoy ya terminó.' }

  const email = useSessionStore.getState().email ?? exampleStudent.email
  const account = useStudentAccountsStore.getState().findByEmail(email)
  const todayLabel = formatDay(at)
  const previous = account?.history.find((entry) => entry.label === todayLabel)
  if (previous) {
    return {
      registered: false,
      message: `Ya estás dentro desde las ${previous.arrival ?? '—'}. ¡Disfruta la clase!`
    }
  }

  const arrival = clockTime(at)
  const status = statusForArrival(arrival, todayClass.start, lateMinutes)
  useStudentAccountsStore.getState().recordEntry(email, { label: todayLabel, arrival, status })
  return { registered: true, arrival }
}

// El QR leído con la cámara o el código escrito en la pantalla de escanear.
export function registerReading(payload: string, now = new Date()): CheckInResult {
  const problem = classCodeProblem(payload, now)
  if (problem !== null) return { registered: false, message: problem }
  return registerArrival(now)
}
