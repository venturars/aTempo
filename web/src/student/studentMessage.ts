import { formatTime } from '../lang/format'
import type { TextKey } from '../lang/messages'
import { text } from '../lang/useText'

export type StudentMessage = {
  key: TextKey
  time?: string
}

export function messageText(message: StudentMessage): string {
  return message.time === undefined
    ? text(message.key)
    : text(message.key, { time: formatTime(message.time) })
}
