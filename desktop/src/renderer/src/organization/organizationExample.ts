export type CourseMetric = {
  count: number | null
  base: number | null
  percentage: string | null
}

export type OrganizationCourse = {
  id: string
  name: string
  teacher: string
  absences: CourseMetric
  justifiedAbsences: number
  delays: CourseMetric
  provisional: boolean
}

export type ReviewStudent = {
  id: string
  name: string
  initials: string
  course: string
  patterns: { kind: 'absence' | 'delay'; label: string }[]
  provisional: boolean
}

export type OrganizationDashboard = {
  organization: string
  period: string
  profile: { name: string; initials: string; role: string }
  reviewStudentCount: number
  provisional: boolean
  courses: OrganizationCourse[]
  students: ReviewStudent[]
  pending: { label: string; count: number; description: string }[]
  quality: string[]
}

export const organizationExample: OrganizationDashboard = {
  organization: 'Academia Horizonte',
  period: '1–30 de noviembre de 2026',
  profile: { name: 'María Torres', initials: 'MT', role: 'Administración' },
  reviewStudentCount: 4,
  provisional: true,
  courses: [
    {
      id: 'english-b1',
      name: 'Inglés · B1',
      teacher: 'Laura Méndez',
      absences: { count: 18, base: 200, percentage: '9 %' },
      justifiedAbsences: 5,
      delays: { count: 14, base: 182, percentage: '7,7 %' },
      provisional: true
    },
    {
      id: 'english-b2',
      name: 'Inglés · B2',
      teacher: 'Carlos Ruiz',
      absences: { count: 8, base: 160, percentage: '5 %' },
      justifiedAbsences: 3,
      delays: { count: 6, base: 152, percentage: '3,9 %' },
      provisional: false
    },
    {
      id: 'french-a2',
      name: 'Francés · A2',
      teacher: 'Elena Vidal',
      absences: { count: 12, base: 150, percentage: '8 %' },
      justifiedAbsences: 4,
      delays: { count: 9, base: 138, percentage: '6,5 %' },
      provisional: true
    }
  ],
  students: [
    {
      id: 'ana',
      name: 'Ana López',
      initials: 'AL',
      course: 'Inglés · B1',
      patterns: [{ kind: 'absence', label: '3 ausencias en 5 sesiones' }],
      provisional: true
    },
    {
      id: 'diego',
      name: 'Diego Martín',
      initials: 'DM',
      course: 'Inglés · B1',
      patterns: [{ kind: 'delay', label: '4 retrasos en 6 sesiones' }],
      provisional: false
    },
    {
      id: 'sofia',
      name: 'Sofía García',
      initials: 'SG',
      course: 'Francés · A2',
      patterns: [
        { kind: 'absence', label: '3 ausencias en 5 sesiones' },
        { kind: 'delay', label: '4 retrasos en 6 sesiones' }
      ],
      provisional: true
    },
    {
      id: 'lucas',
      name: 'Lucas Pérez',
      initials: 'LP',
      course: 'Inglés · B2',
      patterns: [{ kind: 'delay', label: '4 retrasos en 6 sesiones' }],
      provisional: false
    }
  ],
  pending: [
    { label: 'Justificantes', count: 3, description: 'Pendientes de revisión' },
    { label: 'Correcciones', count: 2, description: 'Registros por confirmar' },
    { label: 'Sesiones sin cerrar', count: 2, description: 'Fuera de las métricas' }
  ],
  quality: [
    'Solo se incluyen sesiones cerradas y no canceladas. Las 2 sesiones abiertas no entran en las métricas.'
  ]
}

export const emptyOrganizationExample: OrganizationDashboard = {
  ...organizationExample,
  reviewStudentCount: 0,
  provisional: false,
  courses: [],
  students: [],
  pending: organizationExample.pending.map((item) => ({ ...item, count: 0 })),
  quality: ['Sin sesiones cerradas en este periodo. Todavía no hay datos de asistencia.']
}

export const incompleteOrganizationExample: OrganizationDashboard = {
  ...organizationExample,
  courses: [
    {
      ...organizationExample.courses[0],
      absences: { count: null, base: null, percentage: null },
      delays: { count: 0, base: 0, percentage: null }
    }
  ],
  quality: [
    'Faltan registros para completar las métricas del curso.',
    'Una base desconocida o sin registros se muestra como Sin datos. Las sesiones abiertas no entran en las métricas.'
  ]
}
