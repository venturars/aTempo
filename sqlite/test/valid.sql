PRAGMA foreign_keys = ON;

INSERT INTO session (
  id, course_id, professor_id, start_at, end_at, status, closed_at, late_after_minutes, expected_count
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '2026-01-01T10:00:00.000Z',
  '2026-01-01T12:00:00.000Z',
  'open',
  NULL,
  10,
  20
);

INSERT INTO session (
  id, course_id, professor_id, start_at, end_at, status, closed_at, late_after_minutes, expected_count
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '2026-01-02T10:00:00.000Z',
  '2026-01-02T12:00:00.000Z',
  'closed',
  '2026-01-02T12:05:00.000Z',
  10,
  20
);

INSERT INTO attendance (session_id, student_id, status, check_in_method, checked_in_at) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'present',
  'button',
  '2026-01-01T10:05:00.000Z'
);
