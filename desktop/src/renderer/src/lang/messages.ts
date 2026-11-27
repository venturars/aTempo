import es from '../locales/es.json'
import en from '../locales/en.json'

export const messages = { es, en }

export type Language = keyof typeof messages

export const languages = Object.keys(messages) as Language[]

export type Messages = typeof es

export type Plural = { zero?: string; one: string; other: string }

type Paths<Tree> = {
  [Key in keyof Tree & string]: Tree[Key] extends string | Plural
    ? Key
    : `${Key}.${Paths<Tree[Key]>}`
}[keyof Tree & string]

export type TextKey = Paths<Messages>
