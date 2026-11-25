import { formatTime } from '../language/format'
import type { TextKey } from '../language/messages'
import { text } from '../language/useText'

// Un mensaje que se enseña más tarde, por ejemplo en el aviso que sale al cambiar de pantalla.
// Guarda la clave del texto y, si la lleva, una hora «HH:MM». Se traduce al pintar.
export type StudentMessage = {
  key: TextKey
  time?: string
}

// El texto del mensaje en el idioma elegido. Solo se llama al pintar.
export function messageText(message: StudentMessage): string {
  return message.time === undefined
    ? text(message.key)
    : text(message.key, { time: formatTime(message.time) })
}
