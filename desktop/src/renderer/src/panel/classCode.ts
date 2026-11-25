// El QR y el código de la clase cambian cada 30 segundos, alineados con el reloj, como Google
// Authenticator. El sitio del alumno hace la misma cuenta con su reloj y acepta el periodo
// anterior, el actual y el siguiente (por si el reloj del móvil va unos segundos detrás).
// Sin servidor, la regla está en las dos apps.

export const classCode = 'ATEMPO-CLASE-1109'

export const codePeriodMs = 30000

// Número del periodo de 30 segundos en el que cae una hora.
export function codePeriod(time: number): number {
  return Math.floor(time / codePeriodMs)
}

// Segundos que le quedan al periodo, redondeados hacia arriba: en el límite exacto quedan 30.
export function secondsLeft(time: number): number {
  return Math.ceil((codePeriodMs - (time % codePeriodMs)) / 1000)
}

// FNV-1a de 32 bits: el mismo texto da siempre el mismo número.
function hashText(text: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

// Código de 6 cifras para quien no puede escanear.
export function backupCode(period: number): string {
  return String(hashText(`${classCode}:${period}`) % 1000000).padStart(6, '0')
}

// Lo que registra el alumno: la clase y el código del periodo.
export function checkInCode(period: number): string {
  return `${classCode}-${backupCode(period)}`
}

// El enlace que lleva el QR: la cámara del móvil abre el sitio del alumno y registra la entrada.
export function checkInUrlFor(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/student/check-in?code=${classCode}-${code}`
}

export function checkInUrl(siteUrl: string, period: number): string {
  return checkInUrlFor(siteUrl, backupCode(period))
}
