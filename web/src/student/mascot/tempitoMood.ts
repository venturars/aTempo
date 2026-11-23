// Tempito se pone según lo que falta para la hora a la que hay que llegar.
//
//   más de 5 minutos antes   → chill     (gafas de sol, tranquilo)
//   de 5 minutos a 30 s      → late      (corre)
//   últimos 30 segundos      → stressed  (agobio)
//   ya pasó la hora          → rushed    (corre a toda prisa, con pánico)
//
// «happy» (ya registró la entrada) lo decide la pantalla de inicio, en homeState.ts.

import { minutesOfDay } from '../studentDate'

export type TempitoMood = 'chill' | 'late' | 'stressed' | 'rushed' | 'happy'

const startsRunningAtSeconds = 5 * 60
const startsStressAtSeconds = 30

function secondsOfDay(time: string): number {
  return minutesOfDay(time) * 60
}

// Segundos que faltan hasta una hora del día («09:00»). Negativo si ya pasó.
export function secondsUntil(now: Date, time: string): number {
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  return secondsOfDay(time) - nowSeconds
}

export function moodBeforeDeadline(secondsLeft: number): TempitoMood {
  if (secondsLeft > startsRunningAtSeconds) return 'chill'
  if (secondsLeft > startsStressAtSeconds) return 'late'
  if (secondsLeft > 0) return 'stressed'
  return 'rushed'
}
