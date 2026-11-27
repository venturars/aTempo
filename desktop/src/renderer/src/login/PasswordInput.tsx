import { useEffect, useRef, useState, type ComponentProps } from 'react'

const eyeIcon = (
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
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const eyeOffIcon = (
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
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.8 3.8M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
  </svg>
)

// Campo de contraseña con el botón de ojo dentro, como el patrón «Contraseña» de la guía visual.
// className es el del campo (input, input-error, w-full) y se aplica al contenedor, como pide daisyUI.
export function PasswordInput({
  className = 'input w-full',
  ...props
}: Omit<ComponentProps<'input'>, 'type'>): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  // Al enviar el formulario la contraseña vuelve a ocultarse.
  useEffect(() => {
    const form = input.current?.form
    if (!form) return
    const hide = (): void => setVisible(false)
    form.addEventListener('submit', hide)
    return () => form.removeEventListener('submit', hide)
  }, [])

  return (
    <div className={`${className} pr-1`}>
      <input {...props} ref={input} className="grow" type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="btn btn-ghost btn-square btn-sm"
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? eyeOffIcon : eyeIcon}
        {/* Texto oculto y no aria-label: así getByLabel('Contraseña') sigue encontrando solo el campo. */}
        <span className="sr-only">{visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
      </button>
    </div>
  )
}
