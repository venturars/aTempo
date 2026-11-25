import es from '../locales/es.json'
import en from '../locales/en.json'

// Los textos de cada idioma. Para añadir uno: su JSON en locales/ y una línea aquí.
export const messages = { es, en }

export type Language = keyof typeof messages

export const languages = Object.keys(messages) as Language[]

// El español es el texto original: da las claves y es la reserva si falta una traducción.
export type Messages = typeof es

// Un texto que depende de un número: «1 alumno», «3 alumnos».
export type Plural = { zero?: string; one: string; other: string }

// La ruta de cada texto de es.json, por ejemplo «panel.closeList».
type Paths<Tree> = {
  [Key in keyof Tree & string]: Tree[Key] extends string | Plural
    ? Key
    : `${Key}.${Paths<Tree[Key]>}`
}[keyof Tree & string]

export type TextKey = Paths<Messages>
