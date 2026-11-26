import { createGetOrganizationDashboard } from './get-organization-dashboard'

const dashboardKeys = [
  'organization',
  'period',
  'profile',
  'reviewStudentCount',
  'provisional',
  'courses',
  'students',
  'pending',
  'quality',
] as const

describe('getOrganizationDashboard', () => {
  const getDashboard = createGetOrganizationDashboard()

  it('returns complete fixture by default', async () => {
    const result = await getDashboard({})
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const key of dashboardKeys) {
      expect(result.value).toHaveProperty(key)
    }
    expect(result.value.organization).toBe('Academia Horizonte')
    expect(result.value.courses.length).toBeGreaterThan(0)
  })

  it('returns empty and incomplete fixtures', async () => {
    const empty = await getDashboard({ fixture: 'empty' })
    const incomplete = await getDashboard({ fixture: 'incomplete' })
    expect(empty.ok && incomplete.ok).toBe(true)
    if (!empty.ok || !incomplete.ok) return
    expect(empty.value.courses).toEqual([])
    expect(empty.value.students).toEqual([])
    expect(incomplete.value.courses[0]?.absences.count).toBeNull()
  })

  it('rejects unknown fixture', async () => {
    const result = await getDashboard({ fixture: 'other' as 'complete' })
    expect(result.ok).toBe(false)
  })
})