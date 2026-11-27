"""SDK Python de aTempo. Session y attendance sobre SQLite."""

from atempo_errors import (
    ConfigurationError,
    ConflictError,
    DomainError,
    DomainErrorKind,
    NotFoundError,
    PersistenceError,
    ValidationError,
)

from data_access_python.attendance.add_attendance import (
    AddAttendanceInput,
    AddAttendanceOutput,
    add_attendance,
)
from data_access_python.attendance.retrieve_all_attendances import (
    RetrieveAllAttendancesOutput,
    retrieve_all_attendances,
)
from data_access_python.attendance.retrieve_all_attendances_by_session import (
    RetrieveAllAttendancesBySessionInput,
    RetrieveAllAttendancesBySessionOutput,
    retrieve_all_attendances_by_session,
)
from data_access_python.attendance.remove_attendance import (
    RemoveAttendanceInput,
    RemoveAttendanceOutput,
    remove_attendance,
)
from data_access_python.attendance.update_attendance import (
    UpdateAttendanceInput,
    UpdateAttendanceOutput,
    update_attendance,
)
from data_access_python.shared.errors import DomainErrorId
from data_access_python.session.add_session import (
    AddSessionInput,
    AddSessionOutput,
    add_session,
)
from data_access_python.session.remove_session import (
    RemoveSessionInput,
    RemoveSessionOutput,
    remove_session,
)
from data_access_python.session.retrieve_session_by_id import (
    RetrieveSessionByIdInput,
    RetrieveSessionByIdOutput,
    retrieve_session_by_id,
)
from data_access_python.session.retrieve_all_sessions import (
    RetrieveAllSessionsOutput,
    retrieve_all_sessions,
)
from data_access_python.session.retrieve_all_sessions_by_course import (
    RetrieveAllSessionsByCourseInput,
    RetrieveAllSessionsByCourseOutput,
    retrieve_all_sessions_by_course,
)
from data_access_python.session.retrieve_all_sessions_by_professor import (
    RetrieveAllSessionsByProfessorInput,
    RetrieveAllSessionsByProfessorOutput,
    retrieve_all_sessions_by_professor,
)
from data_access_python.session.update_session import (
    UpdateSessionInput,
    UpdateSessionOutput,
    update_session,
)
from data_access_python.sqlite.check import check
from data_access_python.sqlite.pool import close_pool, reset_pool
from data_access_python.shared.types.attendance import Attendance
from data_access_python.shared.validation.attendance import assert_attendance
from data_access_python.sqlite.rows.attendance import attendance_from_row
from data_access_python.shared.types.session import (
    Session,
    SessionCreate,
    SessionUpdate,
)
from data_access_python.shared.validation.session import (
    assert_session,
    assert_session_create,
    assert_session_update,
)
from data_access_python.sqlite.rows.session import session_from_row

__all__ = [
    "AddAttendanceInput",
    "AddAttendanceOutput",
    "Attendance",
    "ConflictError",
    "ConfigurationError",
    "AddSessionInput",
    "AddSessionOutput",
    "RemoveSessionInput",
    "RemoveSessionOutput",
    "DomainError",
    "DomainErrorKind",
    "DomainErrorId",
    "RetrieveSessionByIdInput",
    "RetrieveSessionByIdOutput",
    "RetrieveAllAttendancesBySessionInput",
    "RetrieveAllAttendancesBySessionOutput",
    "RetrieveAllAttendancesOutput",
    "RetrieveAllSessionsByCourseInput",
    "RetrieveAllSessionsByCourseOutput",
    "RetrieveAllSessionsByProfessorInput",
    "RetrieveAllSessionsByProfessorOutput",
    "RetrieveAllSessionsOutput",
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
    "attendance_from_row",
    "check",
    "close_pool",
    "session_from_row",
    "add_session",
    "remove_session",
    "retrieve_session_by_id",
    "retrieve_all_attendances",
    "retrieve_all_attendances_by_session",
    "retrieve_all_sessions",
    "retrieve_all_sessions_by_course",
    "retrieve_all_sessions_by_professor",
    "remove_attendance",
    "reset_pool",
    "update_attendance",
    "update_session",
]
