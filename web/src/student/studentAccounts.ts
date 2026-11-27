import { create } from 'zustand'
import type { TextKey } from '../lang/messages'
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
import { dateKey, dateKeyFromOldLabel, minutesOfDay } from './studentDate'
import type { StudentMessage } from './studentMessage'

const accountsKey = storageKeys.accounts

type StudentAccountsState = {
  accounts: StudentAccount[]
  findByEmail: (email: string) => StudentAccount | undefined
  recordEntry: (email: string, entry: ClassEntry) => void
}

function copyExample(): StudentAccount {
  return {
    ...exampleStudent,
    history: exampleStudent.history.map((entry) => ({ ...entry }))
  }
}

function readAccounts(): StudentAccount[] {
  if (typeof localStorage === 'undefined') return [copyExample()]
  const raw = localStorage.getItem(accountsKey)
  if (raw === null) return [copyExample()]
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [copyExample()]
    // Descarta contraseñas que dejaron las versiones locales anteriores de la demo.
    const accounts = parsed.filter(isStudentAccount).map((account) => {
      const safeAccount = { ...account, history: readHistory(account.history) }
      delete safeAccount.password
      return safeAccount
    })
    if (accounts.length === 0) return [copyExample()]
    saveAccounts(accounts)
    return accounts
  } catch {
    return [copyExample()]
  }
}

function isStudentAccount(value: unknown): value is StudentAccount & { password?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    typeof value.email === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'history' in value &&
    Array.isArray(value.history)
  )
}

function isStatus(value: unknown): value is ClassEntry['status'] {
  return value === 'presente' || value === 'tarde' || value === 'ausente'
}

// Una entrada guardada. Las versiones anteriores guardaban el día en español
// («Mar 10 nov», en label); se pasa a su fecha. La que no se entiende se descarta.
function readEntry(value: unknown): ClassEntry | null {
  if (typeof value !== 'object' || value === null) return null
  const entry = value as Record<string, unknown>
  if (!isStatus(entry.status)) return null
  const arrival = typeof entry.arrival === 'string' ? entry.arrival : null
  if (typeof entry.date === 'string') return { date: entry.date, arrival, status: entry.status }
  const date = typeof entry.label === 'string' ? dateKeyFromOldLabel(entry.label) : null
  return date === null ? null : { date, arrival, status: entry.status }
}

function readHistory(history: unknown[]): ClassEntry[] {
  return history.map(readEntry).filter((entry) => entry !== null)
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
  recordEntry: (email, entry) => {
    const wanted = normalizeEmail(email)
    const accounts = get().accounts.map((account) => {
      if (normalizeEmail(account.email) !== wanted) return account
      if (account.history.some((item) => item.date === entry.date)) return account
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
// El mensaje guarda la clave del texto; la pantalla lo traduce al pintarlo.
export type CheckInResult =
  { registered: true; arrival: string } | { registered: false; message: StudentMessage }

// Por qué no vale un código: no es de esta clase, o sí lo es pero ya caducó.
export type CodeProblem = 'wrong-class' | 'expired'

const codeProblemMessage: Record<CodeProblem, TextKey> = {
  'wrong-class': 'scan.errors.wrongClass',
  expired: 'scan.errors.expired'
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
  if (!isClassDay(at))
    return {
      registered: false,
      message: { key: 'checkIn.errors.noClassToday' }
    }
  if (classIsOver(at)) return { registered: false, message: { key: 'checkIn.errors.classOver' } }

  // Sin sesión no se apunta nada: la entrada siempre es de quien ha entrado.
  const email = useSessionStore.getState().email
  const signInFirst: CheckInResult = {
    registered: false,
    message: { key: 'checkIn.errors.signInFirst' }
  }
  if (email === null) return signInFirst
  const account = useStudentAccountsStore.getState().findByEmail(email)
  if (account === undefined) return signInFirst
  const today = dateKey(at)
  const previous = account.history.find((entry) => entry.date === today)
  if (previous) {
    return {
      registered: false,
      message:
        previous.arrival === null
          ? { key: 'checkIn.errors.alreadyInside' }
          : {
              key: 'checkIn.errors.alreadyInsideSince',
              time: previous.arrival
            }
    }
  }

  const arrival = clockTime(at)
  const status = statusForArrival(arrival, todayClass.start, lateMinutes)
  useStudentAccountsStore.getState().recordEntry(email, { date: today, arrival, status })
  return { registered: true, arrival }
}

// El QR leído con la cámara o el código escrito en la pantalla de escanear.
export function registerReading(payload: string, now = new Date()): CheckInResult {
  const problem = classCodeProblem(payload, now)
  if (problem !== null) {
    return { registered: false, message: { key: codeProblemMessage[problem] } }
  }
  return registerArrival(now)
}
