const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Antes de las 6 y desde las 21 es de noche. Hasta las 14 es por la mañana.
export function greetingForHour(hour: number): string {
  if (hour < 6 || hour >= 21) return 'Buenas noches'
  if (hour < 14) return 'Buenos días'
  return 'Buenas tardes'
}

// Ejemplo: «Mié 11 nov».
export function formatDay(date: Date): string {
  return `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}

// Ejemplo: «09:02».
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

