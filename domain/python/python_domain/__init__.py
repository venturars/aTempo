"""SDK Python de aTempo. Session y attendance sobre SQLite."""

from python_domain.attendance.add_attendance import (
    AddAttendanceInput,
    AddAttendanceOutput,
    add_attendance,
)
from python_domain.attendance.retrieve_all_attendances import (
    RetrieveAllAttendancesOutput,
    retrieve_all_attendances,
)
from python_domain.attendance.retrieve_all_attendances_by_session import (
    RetrieveAllAttendancesBySessionInput,
    RetrieveAllAttendancesBySessionOutput,
    retrieve_all_attendances_by_session,
)
from python_domain.attendance.remove_attendance import (
    RemoveAttendanceInput,
    RemoveAttendanceOutput,
    remove_attendance,
)
from python_domain.attendance.insert_attendance import (
    InsertAttendanceInput,
    InsertAttendanceOutput,
    insert_attendance,
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
from python_domain.session.add_session import (
    AddSessionInput,
    AddSessionOutput,
    add_session,
)
from python_domain.session.remove_session import (
    RemoveSessionInput,
    RemoveSessionOutput,
    remove_session,
)
from python_domain.session.retrieve_session_by_id import (
    RetrieveSessionByIdInput,
    RetrieveSessionByIdOutput,
    retrieve_session_by_id,
)
from python_domain.session.retrieve_all_sessions import RetrieveAllSessionsOutput, retrieve_all_sessions
from python_domain.session.retrieve_all_sessions_by_course import (
    RetrieveAllSessionsByCourseInput,
    RetrieveAllSessionsByCourseOutput,
    retrieve_all_sessions_by_course,
)
from python_domain.session.retrieve_all_sessions_by_professor import (
    RetrieveAllSessionsByProfessorInput,
    RetrieveAllSessionsByProfessorOutput,
    retrieve_all_sessions_by_professor,
)
from python_domain.session.insert_session import (
    InsertSessionInput,
    InsertSessionOutput,
    insert_session,
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
    "AddSessionInput",
    "AddSessionOutput",
    "RemoveSessionInput",
    "RemoveSessionOutput",
    "DomainError",
    "DomainErrorCode",
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
    "InsertAttendanceInput",
    "InsertAttendanceOutput",
    "InsertSessionInput",
    "InsertSessionOutput",
    "ValidationError",
    "add_attendance",
    "assert_attendance",
    "assert_session",
    "assert_session_create",
    "assert_session_update",
    "check",
    "close_pool",
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
    "insert_attendance",
    "insert_session",
]
