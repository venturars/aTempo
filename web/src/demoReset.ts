// Solo en desarrollo: abrir la web con ?reiniciar empieza la demo de cero en este navegador.
// Borra las cuentas locales, las entradas registradas, los avisos, el escaneo pendiente y el
// idioma elegido.
// Lleva al login sin abrir una sesión falsa; el tema se queda como estaba.
// Se importa antes que nada en main.tsx, porque los stores leen localStorage al cargar.
import { storageKeys } from './storageKeys'

const demoKeys = [
  storageKeys.accounts,
  storageKeys.notices,
  storageKeys.pendingCheckIn,
  storageKeys.language,
  storageKeys.session
]

const url = new URL(window.location.href)

if (import.meta.env.DEV && url.searchParams.has('reiniciar')) {
  demoKeys.forEach((key) => localStorage.removeItem(key))
  window.history.replaceState(null, '', '/')
}
