// Claves de localStorage del sitio del alumno. Se guardan en localStorage y no por pestaña:
// la cámara del móvil abre el enlace del QR en una pestaña nueva, y ahí la sesión tiene que seguir.
// Viven en un módulo sin efectos para que demoReset.ts pueda usarlas sin cargar los stores,
// que leen localStorage nada más importarse.
export const storageKeys = {
  session: 'atempo-student-session',
  theme: 'atempo-student-theme',
  lang: 'atempo-student-lang',
  accounts: 'atempo-student-accounts',
  notices: 'atempo-student-notices',
  pendingCheckIn: 'atempo-student-pending-check-in'
} as const
