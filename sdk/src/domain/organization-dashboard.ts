/**
 * DTO de presentación del resumen de Electron (`organizationExample.ts`).
 * Los `string` son etiquetas de UI (nombres, periodos, porcentajes formateados),
 * no columnas SQL; los números son métricas ya calculadas para pantalla.
 */
export type CourseMetric = {
  readonly count: number | null
  readonly base: number | null
  readonly percentage: string | null
}

export type OrganizationCourse = {
  readonly id: string
  readonly name: string
  readonly teacher: string
  readonly absences: CourseMetric
  readonly justifiedAbsences: number
  readonly delays: CourseMetric
  readonly provisional: boolean
}

export type ReviewStudent = {
  readonly id: string
  readonly name: string
  readonly initials: string
  readonly course: string
  readonly patterns: ReadonlyArray<{
    readonly kind: 'absence' | 'delay'
    readonly label: string
  }>
  readonly provisional: boolean
}

export type OrganizationDashboard = {
  readonly organization: string
  readonly period: string
  readonly profile: { readonly name: string; readonly initials: string; readonly role: string }
  readonly reviewStudentCount: number
  readonly provisional: boolean
  readonly courses: ReadonlyArray<OrganizationCourse>
  readonly students: ReadonlyArray<ReviewStudent>
  readonly pending: ReadonlyArray<{
    readonly label: string
    readonly count: number
    readonly description: string
  }>
  readonly quality: ReadonlyArray<string>
}

export type DashboardFixture = 'complete' | 'empty' | 'incomplete'