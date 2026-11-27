import { create } from 'zustand'
import { languages, type Language } from './messages'

export type LanguageChoice = 'device' | Language

const choiceKey = 'atempo-lang'

const defaultRegion: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US'
}

function isLanguage(value: string): value is Language {
  return (languages as readonly string[]).includes(value)
}

function languageOf(locale: string): Language | null {
  const code = locale.toLowerCase().split('-')[0]
  return isLanguage(code) ? code : null
}

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
    return
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

if (typeof document !== 'undefined') {
  document.documentElement.lang = useLanguageStore.getState().lang
}
