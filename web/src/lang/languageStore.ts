import { create } from 'zustand'
import { storageKeys } from '../storageKeys'
import { languages, type Language } from './messages'

// «device» sigue el idioma del navegador. Las otras opciones lo fijan.
export type LanguageChoice = 'device' | Language

const choiceKey = storageKeys.lang

// La región de cada idioma cuando el navegador habla otro.
const defaultRegion: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US'
}

function isLanguage(value: string): value is Language {
  return (languages as readonly string[]).includes(value)
}

// «en-GB» → «en». Devuelve null si la aplicación no tiene ese idioma.
function languageOf(locale: string): Language | null {
  const code = locale.toLowerCase().split('-')[0]
  return isLanguage(code) ? code : null
}

// Las fechas y números siguen la región del navegador si habla el idioma elegido:
// en inglés, un navegador en-GB escribe «09:05» y uno en-US «9:05 AM».
function regionFor(language: Language, deviceLocale: string): string {
  const sameLanguage = languageOf(deviceLocale) === language
  return sameLanguage && deviceLocale.includes('-') ? deviceLocale : defaultRegion[language]
}

function resolve(choice: LanguageChoice): { lang: Language; region: string } {
  const deviceLocale = navigator.language
  const language = choice === 'device' ? (languageOf(deviceLocale) ?? 'es') : choice
  return { lang: language, region: regionFor(language, deviceLocale) }
}

function readChoice(): LanguageChoice {
  try {
    const saved = localStorage.getItem(choiceKey)
    return saved !== null && isLanguage(saved) ? saved : 'device'
  } catch {
    // Sin almacenamiento se sigue el idioma del navegador.
    return 'device'
  }
}

function saveChoice(choice: LanguageChoice): void {
  try {
    if (choice === 'device') {
      localStorage.removeItem(choiceKey)
    } else {
      localStorage.setItem(choiceKey, choice)
    }
  } catch {
    // El idioma cambia igual; solo no se recuerda en el próximo arranque.
  }
}

type LanguageState = {
  choice: LanguageChoice
  lang: Language
  region: string
  choose: (choice: LanguageChoice) => void
}

const firstChoice = readChoice()

export const useLanguageStore = create<LanguageState>((set) => ({
  choice: firstChoice,
  ...resolve(firstChoice),
  choose: (choice) => {
    saveChoice(choice)
    const resolved = resolve(choice)
    document.documentElement.lang = resolved.lang
    set({ choice, ...resolved })
  }
}))

// Los tests de los stores cargan este módulo en Node, que no tiene document.
if (typeof document !== 'undefined') {
  document.documentElement.lang = useLanguageStore.getState().lang
}
