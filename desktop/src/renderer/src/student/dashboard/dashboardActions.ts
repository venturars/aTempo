export type DashboardActionId =
  'registrar-asistencia' | 'avisar-retrasos-ausencias' | 'proxima-clase' | 'resumen-asistencia'

export type DashboardAction = {
  id: DashboardActionId
  lines: string[]
}

export const dashboardActions: DashboardAction[] = [
  { id: 'registrar-asistencia', lines: ['Registrar asistencia'] },
  { id: 'proxima-clase', lines: ['Próxima clase'] },
  { id: 'avisar-retrasos-ausencias', lines: ['Avisar de retrasos', 'o ausencias'] },
  { id: 'resumen-asistencia', lines: ['Resumen de asistencia'] }
]

export function onDashboardAction(actionId: DashboardActionId): void {
  void actionId
}
