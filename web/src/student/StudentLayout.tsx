import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { RequireStudent } from '../session/RequireStudent'
import { applyTheme, readTheme, useSessionStore, type ThemeName } from '../session/sessionStore'
import { useFlashStore } from './flashStore'
import { flowTopBelowHeader } from './flowLayout'
import { useCurrentStudent } from './studentAccounts'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part !== '')
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : ''
  return (first + last).toUpperCase()
}

// La cabecera y el contenido comparten el mismo ancho, para que el borde izquierdo coincida.
const pageWidth = 'mx-auto w-full max-w-3xl px-4 sm:px-6'

export function StudentLayout({
  children,
  place = 'start'
}: {
  children: React.ReactNode
  place?: 'center' | 'start'
}): React.JSX.Element {
  const student = useCurrentStudent()
  const endStudentSession = useSessionStore((state) => state.endStudentSession)
  const navigate = useNavigate()
  const [theme, setTheme] = useState<ThemeName>(readTheme)
  const accountMenu = useRef<HTMLDetailsElement>(null)
  useCloseOnOutsideClick(accountMenu)

  function onTheme(): void {
    const next = theme === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro'
    applyTheme(next)
    setTheme(next)
  }

  function onSignOut(): void {
    accountMenu.current?.removeAttribute('open')
    endStudentSession()
    void navigate({ to: '/' })
  }

  return (
    <RequireStudent>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-hairline bg-base-200/85 backdrop-blur">
          <div className={`${pageWidth} flex h-16 items-stretch gap-2 sm:gap-8`}>
            <Link
              className="flex items-center text-xl font-semibold tracking-tight"
              to="/student/dashboard"
            >
              aTempo
            </Link>
            <nav className="flex items-stretch sm:-mx-3.5" aria-label="Principal">
              <Link className="nav-link" to="/student/notice">
                Avisar
              </Link>
              <Link className="nav-link" to="/student/history">
                Resumen
              </Link>
            </nav>
            <div className="ml-auto flex items-center sm:pr-2">
              <ThemeToggle dark={theme === 'atempo-oscuro'} onToggle={onTheme} />
            </div>
            <details ref={accountMenu} className="dropdown dropdown-end flex items-center">
              <summary
                className="avatar avatar-placeholder cursor-pointer rounded-full transition-shadow hover:ring-4 hover:ring-base-content/8"
                aria-label="Cuenta"
              >
                <div className={`w-9 rounded-full sm:w-10 ${avatarToneFor(student.name)}`}>
                  <span className="text-sm font-semibold">{initials(student.name)}</span>
                </div>
              </summary>
              <ul className="dropdown-content menu rounded-box top-full z-10 mt-1 w-52 bg-base-100 p-2 shadow-lg">
                <li>
                  <button type="button" onClick={onSignOut}>
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </header>
        <main
          className={
            place === 'center'
              ? `${pageWidth} page-enter flex flex-1 flex-col items-center py-10 [justify-content:safe_center] ${flowTopBelowHeader}`
              : `${pageWidth} page-enter flex flex-1 flex-col gap-5 py-8 sm:py-10`
          }
        >
          {children}
        </main>
        <FlashToast />
      </div>
    </RequireStudent>
  )
}

// El menú de la cuenta es un <details>: se abre y se cierra al pulsar, también en Safari.
// Además se cierra al pulsar fuera o con Escape.
function useCloseOnOutsideClick(menu: React.RefObject<HTMLDetailsElement | null>): void {
  useEffect(() => {
    function closeIfOutside(event: PointerEvent): void {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) {
        menu.current.removeAttribute('open')
      }
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.removeAttribute('open')
        menu.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeIfOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menu])
}

const sunIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle className="theme-switch-sun-disc" cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

const moonIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path className="theme-switch-moon-shape" d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />
    <path
      className="theme-switch-moon-shape"
      strokeWidth="1"
      d="M18 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"
    />
  </svg>
)

// Interruptor de tema: la bola se desliza al sol (claro) o a la luna (oscuro).
function ThemeToggle({
  dark,
  onToggle
}: {
  dark: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <button
      className="theme-switch"
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Tema oscuro"
      onClick={onToggle}
    >
      {sunIcon}
      {moonIcon}
      <span className="theme-switch-thumb" aria-hidden="true">
        <span key={dark ? 'moon' : 'sun'} className="contents">
          {dark ? moonIcon : sunIcon}
        </span>
      </span>
    </button>
  )
}

const avatarTones = [
  'avatar-tone-primary',
  'avatar-tone-success',
  'avatar-tone-info',
  'avatar-tone-warning',
  'avatar-tone-secondary',
  'avatar-tone-error'
]

// El mismo nombre siempre da el mismo tono.
function avatarToneFor(name: string): string {
  const total = [...name].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  return avatarTones[total % avatarTones.length] ?? avatarTones[0]
}

const flashSeconds = 4

function FlashToast(): React.JSX.Element | null {
  const message = useFlashStore((state) => state.message)
  const clearFlash = useFlashStore((state) => state.clearFlash)

  useEffect(() => {
    if (message === null) return
    const timer = window.setTimeout(clearFlash, flashSeconds * 1000)
    return () => window.clearTimeout(timer)
  }, [message, clearFlash])

  if (message === null) return null

  return (
    <div className="toast toast-center toast-bottom z-30">
      <div key={message} className="toast-message" role="status">
        <span className="toast-message-icon" aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="toast-message-text">{message}</span>
        <button
          className="btn btn-ghost btn-xs btn-square"
          type="button"
          aria-label="Cerrar"
          onClick={clearFlash}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
