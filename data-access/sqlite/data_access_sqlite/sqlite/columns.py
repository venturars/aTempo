SESSION_COLUMNS = """id,
  course_id,
  professor_id,
  start_at,
  end_at,
  status,
  closed_at,
  late_after_minutes,
  expected_count"""

ATTENDANCE_COLUMNS = """session_id,
  student_id,
  status,
  check_in_method,
  checked_in_at"""
