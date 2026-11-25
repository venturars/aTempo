import type { TextKey } from '../language/messages'
import type { TextValues } from '../language/useText'

// El porcentaje es un número («7.7»); la pantalla lo escribe en el idioma elegido.
export type CourseMetric = {
  count: number | null
  base: number | null
  percentage: number | null
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
  patterns: { kind: 'absence' | 'delay'; count: number; sessions: number }[]
  provisional: boolean
}

export type PendingKind = 'justifications' | 'corrections' | 'openSessions'

// Un aviso de calidad: la clave de su texto y los valores que lo completan.
export type QualityNote = { key: TextKey; values?: TextValues }

export type OrganizationDashboard = {
  organization: string
  // Días «AAAA-MM-DD» del primero y el último del periodo.
  period: { from: string; to: string }
  profile: { name: string; initials: string; role: TextKey }
  reviewStudentCount: number
  provisional: boolean
  courses: OrganizationCourse[]
  students: ReviewStudent[]
  pending: { kind: PendingKind; count: number }[]
  quality: QualityNote[]
}

export const organizationExample: OrganizationDashboard = {
  organization: 'Academia Horizonte',
  period: { from: '2026-11-01', to: '2026-11-30' },
  profile: { name: 'María Torres', initials: 'MT', role: 'organization.roles.administration' },
  reviewStudentCount: 4,
  provisional: true,
  courses: [
    {
      id: 'english-b1',
      name: 'Inglés · B1',
      teacher: 'Laura Méndez',
      absences: { count: 18, base: 200, percentage: 9 },
      justifiedAbsences: 5,
      delays: { count: 14, base: 182, percentage: 7.7 },
      provisional: true
    },
    {
      id: 'english-b2',
      name: 'Inglés · B2',
      teacher: 'Carlos Ruiz',
      absences: { count: 8, base: 160, percentage: 5 },
      justifiedAbsences: 3,
      delays: { count: 6, base: 152, percentage: 3.9 },
      provisional: false
    },
    {
      id: 'french-a2',
      name: 'Francés · A2',
      teacher: 'Elena Vidal',
      absences: { count: 12, base: 150, percentage: 8 },
      justifiedAbsences: 4,
      delays: { count: 9, base: 138, percentage: 6.5 },
      provisional: true
    }
  ],
  students: [
    {
      id: 'ana',
      name: 'Ana López',
      initials: 'AL',
      course: 'Inglés · B1',
      patterns: [{ kind: 'absence', count: 3, sessions: 5 }],
      provisional: true
    },
    {
      id: 'diego',
      name: 'Diego Martín',
      initials: 'DM',
      course: 'Inglés · B1',
      patterns: [{ kind: 'delay', count: 4, sessions: 6 }],
      provisional: false
    },
    {
      id: 'sofia',
      name: 'Sofía García',
      initials: 'SG',
      course: 'Francés · A2',
      patterns: [
        { kind: 'absence', count: 3, sessions: 5 },
        { kind: 'delay', count: 4, sessions: 6 }
      ],
      provisional: true
    },
    {
      id: 'lucas',
      name: 'Lucas Pérez',
      initials: 'LP',
      course: 'Inglés · B2',
      patterns: [{ kind: 'delay', count: 4, sessions: 6 }],
      provisional: false
    }
  ],
  pending: [
    { kind: 'justifications', count: 3 },
    { kind: 'corrections', count: 2 },
    { kind: 'openSessions', count: 2 }
  ],
  quality: [{ key: 'organization.quality.closedSessionsOnly', values: { count: 2 } }]
}

export const emptyOrganizationExample: OrganizationDashboard = {
  ...organizationExample,
  reviewStudentCount: 0,
  provisional: false,
  courses: [],
  students: [],
  pending: organizationExample.pending.map((item) => ({ ...item, count: 0 })),
  quality: [{ key: 'organization.quality.noClosedSessions' }]
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
    { key: 'organization.quality.missingRecords' },
    { key: 'organization.quality.unknownBase' }
  ]
}
