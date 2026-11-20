INSERT INTO session (
  id, course_id, professor_id, start_at, end_at, status, closed_at, late_after_minutes, expected_count
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '2026-01-03T10:00:00.000Z',
  '2026-01-03T12:00:00.000Z',
  'closing',
  '2026-01-03T12:00:00.000Z',
  10,
  20
);
