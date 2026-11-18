// Solo en desarrollo: abrir la web con ?reiniciar empieza la demo de cero en esta pestaña.
// Borra las entradas registradas, las cuentas nuevas, los avisos y el escaneo pendiente, abre la
// sesión de la cuenta de ejemplo y lleva al inicio del alumno. El tema se queda como estaba.
// Se importa antes que nada en main.tsx, porque los stores leen sessionStorage al cargar.
import { storageKeys } from './storageKeys'
import { exampleStudent } from './student/studentExample'

const demoKeys = [storageKeys.accounts, storageKeys.notices, storageKeys.pendingCheckIn]

const url = new URL(window.location.href)

if (import.meta.env.DEV && url.searchParams.has('reiniciar')) {
  demoKeys.forEach((key) => sessionStorage.removeItem(key))
  sessionStorage.setItem(storageKeys.session, exampleStudent.email)
  window.history.replaceState(null, '', '/student/dashboard')
}
