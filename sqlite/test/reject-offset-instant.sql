INSERT INTO session (
  id, course_id, professor_id, start_at, end_at, status, closed_at, late_after_minutes, expected_count
) VALUES (
  '12121212-1212-1212-1212-121212121212',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '2026-01-01T10:00:00.000Z',
  '2026-01-01T11:00:00.000+02:00',
  'open',
  NULL,
  10,
  20
);
