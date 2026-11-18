import { useEffect, useRef } from 'react'
import { Avatar } from './avatar'

// El menú de la cuenta, abajo en la barra lateral: un <details> que se abre al pulsar el nombre y
// se cierra al pulsar otra vez, al pulsar fuera o con Escape.
export function AccountMenu({
  name,
  onLogOut
}: {
  name: string
  onLogOut: () => void
}): React.JSX.Element {
  const menu = useRef<HTMLDetailsElement>(null)
  useCloseOnOutsideOrEscape(menu)

  function logOut(): void {
    menu.current?.removeAttribute('open')
    onLogOut()
  }

  return (
    <details
      ref={menu}
      className="dropdown dropdown-top mt-auto block w-full border-t border-base-content/4"
    >
      <summary className="hover-grey block cursor-pointer px-5 py-4">
        <span className="flex items-center gap-3">
          <Avatar name={name} />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-meta text-base-content/60">Profesor</span>
          </span>
        </span>
      </summary>
      <ul className="dropdown-content menu rounded-box z-10 mb-1 ml-3 w-52 bg-base-100 p-2 shadow-sm">
        <li>
          <button type="button" onClick={logOut}>
            Salir
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
