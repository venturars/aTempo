-- SQLite operativo. session y attendance. UUID del core sin FK SQL.
-- Instantes solo como 2026-09-01T08:00:00.000Z, para que end_at > start_at sea cronológico.

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  professor_id TEXT NOT NULL,
  start_at TEXT NOT NULL CHECK (
    start_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  end_at TEXT NOT NULL CHECK (
    end_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  status TEXT NOT NULL CHECK (status IN ('open', 'closing', 'closed')),
  closed_at TEXT CHECK (
    closed_at IS NULL
    OR closed_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  late_after_minutes INTEGER NOT NULL,
  expected_count INTEGER,
  CHECK (end_at > start_at),
  CHECK (
    (status = 'closed' AND closed_at IS NOT NULL)
    OR (status != 'closed' AND closed_at IS NULL)
  )
);

CREATE TABLE attendance (
  session_id TEXT NOT NULL REFERENCES session (id),
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('present', 'present_late', 'absent', 'notified_absence')
  ),
  check_in_method TEXT CHECK (check_in_method IN ('button', 'qr')),
  checked_in_at TEXT CHECK (
    checked_in_at IS NULL
    OR checked_in_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  PRIMARY KEY (session_id, student_id),
  CHECK (
    (
      status IN ('present', 'present_late')
      AND check_in_method IS NOT NULL
      AND checked_in_at IS NOT NULL
    )
    OR (
      status IN ('absent', 'notified_absence')
      AND check_in_method IS NULL
      AND checked_in_at IS NULL
    )
  )
);
