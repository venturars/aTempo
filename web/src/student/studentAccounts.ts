import { create } from 'zustand'
import { useSessionStore } from '../session/sessionStore'
import { storageKeys } from '../storageKeys'
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
import { formatDay, minutesOfDay } from './studentDate'

const accountsKey = storageKeys.accounts

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
  if (typeof localStorage === 'undefined') return [copyExample()]
  const raw = localStorage.getItem(accountsKey)
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
  localStorage.setItem(accountsKey, JSON.stringify(accounts))
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

// Por qué no vale un código: no es de esta clase, o sí lo es pero ya caducó.
export type CodeProblem = 'wrong-class' | 'expired'

const codeProblemMessage: Record<CodeProblem, string> = {
  'wrong-class': 'Ese código no es de esta clase. Revísalo y prueba otra vez.',
  expired: 'Ese código no vale ahora. Prueba con el que se ve en la pantalla de clase.'
}

function isClassDay(now: Date): boolean {
  return todayClass.weekdays.includes(now.getDay())
}

function minutesNow(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

function classIsOver(now: Date): boolean {
  return minutesNow(now) >= minutesOfDay(todayClass.end)
}

// Comprueba lo leído del QR o lo escrito a mano. Devuelve el problema si no vale, o null si vale.
export function classCodeProblem(payload: string, now: Date): CodeProblem | null {
  const code = readClassCode(payload, todayClass.id)
  if (code === null) return 'wrong-class'
  if (!isCodeValidNow(code, todayClass.id, now)) return 'expired'
  return null
}

// Apunta la entrada de hoy con la hora `at`. Quien ya entró hoy no se apunta dos veces.
export function registerArrival(at: Date): CheckInResult {
  if (!isClassDay(at)) return { registered: false, message: 'Hoy no tienes clase.' }
  if (classIsOver(at)) return { registered: false, message: 'La clase de hoy ya terminó.' }

  // Sin sesión no se apunta nada: la entrada siempre es de quien ha entrado.
  const email = useSessionStore.getState().email
  if (email === null) return { registered: false, message: 'Entra para registrar tu asistencia.' }
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
  if (problem !== null) return { registered: false, message: codeProblemMessage[problem] }
  return registerArrival(now)
}
