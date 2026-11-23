"""SDK Python de aTempo. Session y attendance sobre SQLite."""

from python_domain.attendance.add_attendance import (
    AddAttendanceInput,
    AddAttendanceOutput,
    add_attendance,
)
from python_domain.attendance.list_attendances import (
    ListAttendancesOutput,
    list_attendances,
)
from python_domain.attendance.list_attendances_by_session import (
    ListAttendancesBySessionInput,
    ListAttendancesBySessionOutput,
    list_attendances_by_session,
)
from python_domain.attendance.remove_attendance import (
    RemoveAttendanceInput,
    RemoveAttendanceOutput,
    remove_attendance,
)
from python_domain.attendance.update_attendance import (
    UpdateAttendanceInput,
    UpdateAttendanceOutput,
    update_attendance,
)
from python_domain.errors import (
    ConflictError,
    ConfigurationError,
    DomainError,
    DomainErrorCode,
    NotFoundError,
    PersistenceError,
    ValidationError,
)
from python_domain.session.create_session import (
    CreateSessionInput,
    CreateSessionOutput,
    create_session,
)
from python_domain.session.delete_session import (
    DeleteSessionInput,
    DeleteSessionOutput,
    delete_session,
)
from python_domain.session.get_session_by_id import (
    GetSessionByIdInput,
    GetSessionByIdOutput,
    get_session_by_id,
)
from python_domain.session.list_sessions import ListSessionsOutput, list_sessions
from python_domain.session.list_sessions_by_course import (
    ListSessionsByCourseInput,
    ListSessionsByCourseOutput,
    list_sessions_by_course,
)
from python_domain.session.list_sessions_by_professor import (
    ListSessionsByProfessorInput,
    ListSessionsByProfessorOutput,
    list_sessions_by_professor,
)
from python_domain.session.update_session import (
    UpdateSessionInput,
    UpdateSessionOutput,
    update_session,
)
from python_domain.sqlite.check import check
from python_domain.sqlite.pool import close_pool, reset_pool
from python_domain.types.attendance import Attendance, assert_attendance
from python_domain.types.session import (
    Session,
    SessionCreate,
    SessionUpdate,
    assert_session,
    assert_session_create,
    assert_session_update,
)

__all__ = [
    "AddAttendanceInput",
    "AddAttendanceOutput",
    "Attendance",
    "ConflictError",
    "ConfigurationError",
    "CreateSessionInput",
    "CreateSessionOutput",
    "DeleteSessionInput",
    "DeleteSessionOutput",
    "DomainError",
    "DomainErrorCode",
    "GetSessionByIdInput",
    "GetSessionByIdOutput",
    "ListAttendancesBySessionInput",
    "ListAttendancesBySessionOutput",
    "ListAttendancesOutput",
    "ListSessionsByCourseInput",
    "ListSessionsByCourseOutput",
    "ListSessionsByProfessorInput",
    "ListSessionsByProfessorOutput",
    "ListSessionsOutput",
    "NotFoundError",
    "PersistenceError",
    "RemoveAttendanceInput",
    "RemoveAttendanceOutput",
    "Session",
    "SessionCreate",
    "SessionUpdate",
    "UpdateAttendanceInput",
    "UpdateAttendanceOutput",
    "UpdateSessionInput",
    "UpdateSessionOutput",
    "ValidationError",
    "add_attendance",
    "assert_attendance",
    "assert_session",
    "assert_session_create",
    "assert_session_update",
    "check",
    "close_pool",
    "create_session",
    "delete_session",
    "get_session_by_id",
    "list_attendances",
    "list_attendances_by_session",
    "list_sessions",
    "list_sessions_by_course",
    "list_sessions_by_professor",
    "remove_attendance",
    "reset_pool",
    "update_attendance",
    "update_session",
]
