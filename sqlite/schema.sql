-- SQLite operativo. session y attendance. UUID del core sin FK SQL.

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  professor_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closing', 'closed')),
  closed_at TEXT,
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
  checked_in_at TEXT,
  PRIMARY KEY (session_id, student_id)
);
