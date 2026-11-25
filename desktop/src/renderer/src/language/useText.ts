import { useLanguageStore } from './languageStore'
import { messages, type Plural, type TextKey } from './messages'

export type TextValues = Record<string, string | number>

function lookup(tree: unknown, key: string): string | Plural | undefined {
  let node = tree
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return undefined
    }
    node = (node as Record<string, unknown>)[part]
  }
  return node as string | Plural | undefined
}

function pluralForm(entry: Plural, count: number, region: string): string {
  if (count === 0 && entry.zero !== undefined) {
    return entry.zero
  }
  return new Intl.PluralRules(region).select(count) === 'one' ? entry.one : entry.other
}

// El texto de una clave en el idioma elegido. {nombre} se rellena con values.nombre y,
// si el texto es un plural, values.count elige la forma. Sin traducción, sale el español.
export function text(key: TextKey, values: TextValues = {}): string {
  const { language, region } = useLanguageStore.getState()
  const entry = lookup(messages[language], key) ?? lookup(messages.es, key) ?? key
  const template =
    typeof entry === 'string' ? entry : pluralForm(entry, Number(values.count ?? 0), region)
  return template.replace(/\{(\w+)\}/g, (hole, name: string) =>
    name in values ? String(values[name]) : hole
  )
}

// Para los componentes: devuelve text y vuelve a pintar el componente al cambiar el idioma.
export function useText(): typeof text {
  useLanguageStore((state) => state.region)
  return text
}
