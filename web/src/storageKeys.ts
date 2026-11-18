// Claves de sessionStorage del sitio del alumno.
// Viven en un módulo sin efectos para que demoReset.ts pueda usarlas sin cargar los stores,
// que leen sessionStorage nada más importarse.
export const storageKeys = {
  session: 'atempo-student-session',
  theme: 'atempo-student-theme',
  accounts: 'atempo-student-accounts',
  notices: 'atempo-student-notices',
  pendingCheckIn: 'atempo-student-pending-check-in'
} as const
