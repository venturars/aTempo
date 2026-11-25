import { useLanguageStore, type LanguageChoice } from './languageStore'
import { languages, messages } from './messages'
import { useText } from './useText'

// Del dispositivo, Español, English. Cada idioma se escribe en su propia lengua para que
// lo encuentre quien no lee el idioma de ahora.
export function LanguagePicker({ size = 'sm' }: { size?: 'sm' | 'xs' }): React.JSX.Element {
  const t = useText()
  const choice = useLanguageStore((state) => state.choice)
  const choose = useLanguageStore((state) => state.choose)
  const options: { value: LanguageChoice; label: string }[] = [
    { value: 'device', label: t('language.device') },
    ...languages.map((language) => ({ value: language, label: messages[language].language.name }))
  ]
  return (
    <div className="join" role="group" aria-label={t('language.title')}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          lang={option.value === 'device' ? undefined : option.value}
          aria-pressed={choice === option.value}
          className={`btn join-item ${size === 'xs' ? 'btn-xs' : 'btn-sm min-w-24'} ${choice === option.value ? 'btn-primary' : ''}`}
          onClick={() => choose(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
