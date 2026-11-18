// Si el alumno abre el enlace del QR sin la sesión abierta, primero tiene que entrar.
// Para que el código no caduque mientras escribe la contraseña, se guarda la hora del escaneo
// (con el código ya comprobado) y la entrada se apunta al terminar de entrar o de crear la cuenta.
import { storageKeys } from '../../storageKeys'
import { useFlashStore } from '../flashStore'
import { registerArrival, type CheckInResult } from '../studentAccounts'

const pendingCheckInKey = storageKeys.pendingCheckIn

// Si tarda más que esto en entrar, el escaneo ya no cuenta.
const maxWaitMilliseconds = 10 * 60 * 1000

export function rememberCheckIn(scannedAt: Date): void {
  sessionStorage.setItem(pendingCheckInKey, String(scannedAt.getTime()))
}

const scanTooOld = 'Pasaron más de 10 minutos desde que escaneaste el QR. Escanéalo otra vez.'

// La hora del escaneo guardado, o null si no hay ninguno.
function readScannedAt(): number | null {
  const raw = sessionStorage.getItem(pendingCheckInKey)
  if (raw === null) return null
  const scannedAt = Number(raw)
  return Number.isFinite(scannedAt) ? scannedAt : null
}

// Hay un escaneo guardado y todavía cuenta.
export function hasPendingCheckIn(now = new Date()): boolean {
  const scannedAt = readScannedAt()
  return scannedAt !== null && now.getTime() - scannedAt <= maxWaitMilliseconds
}

// Apunta la entrada del escaneo guardado y lo borra. Si ya no cuenta, dice por qué.
function completePendingCheckIn(now: Date): CheckInResult | null {
  const scannedAt = readScannedAt()
  sessionStorage.removeItem(pendingCheckInKey)
  if (scannedAt === null) return null
  if (now.getTime() - scannedAt > maxWaitMilliseconds) {
    return { registered: false, message: scanTooOld }
  }
  return registerArrival(new Date(scannedAt))
}

// A dónde ir después de entrar o de crear la cuenta.
// Si venía del QR, la entrada queda apuntada con la hora del escaneo.
export function destinationAfterSignIn(
  now = new Date()
): '/student/registered' | '/student/dashboard' {
  const result = completePendingCheckIn(now)
  if (result === null) return '/student/dashboard'
  if (result.registered) return '/student/registered'
  useFlashStore.getState().showFlash(result.message)
  return '/student/dashboard'
}
