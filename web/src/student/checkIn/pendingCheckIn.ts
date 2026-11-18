// Si el alumno abre el enlace del QR sin la sesión abierta, primero tiene que entrar.
// Para que el código no caduque mientras escribe la contraseña, se guarda la hora del escaneo
// (con el código ya comprobado) y la entrada se apunta al terminar de entrar o de crear la cuenta.
import { useFlashStore } from '../flashStore'
import { registerArrival, type CheckInResult } from '../studentAccounts'

export const pendingCheckInKey = 'atempo-student-pending-check-in'

// Si tarda más que esto en entrar, el escaneo ya no cuenta.
const maxWaitMilliseconds = 10 * 60 * 1000

export function rememberCheckIn(scannedAt: Date): void {
  sessionStorage.setItem(pendingCheckInKey, String(scannedAt.getTime()))
}

export function hasPendingCheckIn(): boolean {
  return sessionStorage.getItem(pendingCheckInKey) !== null
}

function completePendingCheckIn(now: Date): CheckInResult | null {
  const raw = sessionStorage.getItem(pendingCheckInKey)
  if (raw === null) return null
  sessionStorage.removeItem(pendingCheckInKey)
  const scannedAt = Number(raw)
  if (!Number.isFinite(scannedAt) || now.getTime() - scannedAt > maxWaitMilliseconds) return null
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
