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

export function text(key: TextKey, values: TextValues = {}): string {
  const { lang, region } = useLanguageStore.getState()
  const entry = lookup(messages[lang], key) ?? lookup(messages.es, key) ?? key
  const template =
    typeof entry === 'string' ? entry : pluralForm(entry, Number(values.count ?? 0), region)
  return template.replace(/\{(\w+)\}/g, (hole, name: string) =>
    name in values ? String(values[name]) : hole
  )
}

export function useText(): typeof text {
  useLanguageStore((state) => state.region)
  return text
}
