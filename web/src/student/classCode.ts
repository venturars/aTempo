// El QR que enseña el profesor cambia cada 30 segundos, como Google Authenticator.
// La app del profesor usa la misma regla, y las dos tienen que dar el mismo código:
//
//   periodo = floor(Date.now() / 30000)
//   código  = FNV-1a de «ATEMPO-CLASE-1109:<periodo>», módulo 10000, con 4 cifras
//   QR      = <sitio del alumno>/student/check-in?code=ATEMPO-CLASE-1109-<código>
//
// Debajo del QR se ven las 4 cifras, para quien prefiera escribirlas.
// Sin servidor, el sitio acepta el código del periodo anterior, el del actual y el del siguiente.
// El siguiente cubre un móvil que lleva el reloj unos segundos por detrás del ordenador del profesor.

const periodMilliseconds = 30_000

// FNV-1a de 32 bits. Los textos son ASCII, así que cada carácter es un byte.
function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function periodOf(now: Date): number {
  return Math.floor(now.getTime() / periodMilliseconds)
}

export function codeForPeriod(classId: string, period: number): string {
  return String(fnv1a(`${classId}:${period}`) % 10000).padStart(4, '0')
}

// Saca las 4 cifras de lo que llegue: el enlace del QR, el texto «ATEMPO-CLASE-1109-1234»
// o las cifras escritas a mano. Si no hay 4 cifras de esta clase, devuelve null.
export function readClassCode(payload: string, classId: string): string | null {
  let value = payload.trim()
  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).searchParams.get('code') ?? ''
    } catch {
      return null
    }
  }
  const prefix = `${classId}-`
  if (value.toUpperCase().startsWith(prefix)) value = value.slice(prefix.length)
  return /^\d{4}$/.test(value) ? value : null
}

export function isCodeValidNow(code: string, classId: string, now: Date): boolean {
  const period = periodOf(now)
  return [period - 1, period, period + 1].some(
    (candidate) => codeForPeriod(classId, candidate) === code
  )
}
