const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const weekdayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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

// «Mié 11 nov» pasa a «Miércoles».
export function weekdayName(dayLabel: string): string {
  const index = weekdays.indexOf(dayLabel.split(' ')[0] ?? '')
  return weekdayNames[index] ?? dayLabel
}

// Minutos desde medianoche de una hora «HH:MM». Ejemplo: «09:30» → 570.
export function minutesOfDay(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}
