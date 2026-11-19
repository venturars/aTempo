import { useEffect, useRef } from 'react'
import { Avatar } from './avatar'

// El menú de la cuenta, abajo en la barra lateral: un <details> que se abre al pulsar el nombre y
// se cierra al pulsar otra vez, al pulsar fuera o con Escape.
export function AccountMenu({
  name,
  onChangePassword,
  onLogOut
}: {
  name: string
  onChangePassword?: () => void
  onLogOut: () => void
}): React.JSX.Element {
  const menu = useRef<HTMLDetailsElement>(null)
  useCloseOnOutsideOrEscape(menu)

  function select(action: () => void): void {
    menu.current?.removeAttribute('open')
    menu.current?.querySelector('summary')?.focus()
    action()
  }

  return (
    <details
      ref={menu}
      className="dropdown dropdown-top group mt-auto block w-full border-t border-base-content/4"
    >
      <summary className="hover-grey block cursor-pointer px-5 py-4">
        <span className="flex items-center gap-3">
          <Avatar name={name} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-meta text-base-content/60">Profesor</span>
          </span>
          <span aria-hidden="true" className="text-base-content/60 group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <ul className="dropdown-content menu rounded-box z-10 mb-1 ml-3 w-52 bg-base-100 p-2 shadow-sm">
        {onChangePassword ? (
          <li>
            <button type="button" onClick={() => select(onChangePassword)}>
              Cambiar contraseña
            </button>
          </li>
        ) : null}
        <li>
          <button type="button" onClick={() => select(onLogOut)}>
            Cerrar sesión
          </button>
        </li>
      </ul>
    </details>
  )
}

function useCloseOnOutsideOrEscape(menu: React.RefObject<HTMLDetailsElement | null>): void {
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
