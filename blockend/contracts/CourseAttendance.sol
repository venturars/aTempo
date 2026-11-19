// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Contrato de asistencia de un curso.
/// @notice Una instancia por curso. La sesión no se actualiza. Hardhat despliega; Anvil notaria.
contract CourseAttendance is Ownable {
    string private courseId;
    bytes32 private immutable accessTokenHash;

    enum Status {
        Present,
        PresentLate,
        Absent,
        NotifiedAbsence
    }

    enum Justification {
        None,
        Pending,
        Justified,
        Rejected
    }

    enum CheckInMethod {
        None,
        Button,
        Qr
    }

    struct Session {
        string id;
        uint64 startAt;
        uint64 endAt;
        uint64 closedAt;
        uint32 lateAfterMinutes;
        string professorId;
        bool exists;
    }

    struct Record {
        Status status;
        Justification justification;
        uint64 checkedInAt;
        CheckInMethod checkInMethod;
        uint64 noticedAt;
        string documentId;
        bool exists;
    }

    struct AttendanceInput {
        string studentId;
        Status status;
        Justification justification;
        uint64 checkedInAt;
        CheckInMethod checkInMethod;
        uint64 noticedAt;
        string documentId;
    }

    mapping(string => Session) private sessions;
    mapping(string => mapping(string => Record)) private records;

    modifier onlyToken(string calldata token) {
        require(keccak256(bytes(token)) == accessTokenHash, "unauthorized");
        _;
    }

    constructor(string memory courseId_, bytes32 accessTokenHash_) Ownable(msg.sender) {
        require(bytes(courseId_).length != 0, "courseId required");
        require(accessTokenHash_ != bytes32(0), "token hash required");
        courseId = courseId_;
        accessTokenHash = accessTokenHash_;
    }

    function transferOwnership(address) public pure override {
        revert("ownership locked");
    }

    function renounceOwnership() public pure override {
        revert("ownership locked");
    }

    function getCourseId(string calldata token) external view onlyToken(token) returns (string memory) {
        return courseId;
    }

    function createSession(
        string calldata token,
        string calldata id,
        uint64 startAt,
        uint64 endAt,
        string calldata professorId
    ) external onlyOwner onlyToken(token) {
        require(bytes(id).length != 0, "id required");
        require(bytes(professorId).length != 0, "professorId required");
        require(endAt > startAt, "endAt");
        require(!sessions[id].exists, "session exists");

        sessions[id] = Session({
            id: id,
            startAt: startAt,
            endAt: endAt,
            closedAt: 0,
            lateAfterMinutes: 0,
            professorId: professorId,
            exists: true
        });
    }

    function getSession(
        string calldata token,
        string calldata id
    )
        external
        view
        onlyToken(token)
        returns (
            string memory sessionId,
            uint64 startAt,
            uint64 endAt,
            uint64 closedAt,
            uint32 lateAfterMinutes,
            string memory professorId
        )
    {
        Session storage session = sessions[id];
        require(session.exists, "unknown session");
        return (
            session.id,
            session.startAt,
            session.endAt,
            session.closedAt,
            session.lateAfterMinutes,
            session.professorId
        );
    }

    function closeSession(
        string calldata token,
        string calldata id,
        uint64 closedAt,
        uint32 lateAfterMinutes,
        AttendanceInput[] calldata attendees
    ) external onlyOwner onlyToken(token) {
        Session storage session = sessions[id];
        require(session.exists, "unknown session");
        if (session.closedAt != 0) {
            return;
        }
        require(closedAt != 0, "closedAt required");

        session.closedAt = closedAt;
        session.lateAfterMinutes = lateAfterMinutes;

        for (uint256 i = 0; i < attendees.length; i++) {
            AttendanceInput calldata row = attendees[i];
            require(bytes(row.studentId).length != 0, "studentId required");
            records[id][row.studentId] = Record({
                status: row.status,
                justification: row.justification,
                checkedInAt: row.checkedInAt,
                checkInMethod: row.checkInMethod,
                noticedAt: row.noticedAt,
                documentId: row.documentId,
                exists: true
            });
        }
    }

    function changeStatus(
        string calldata token,
        string calldata sessionId,
        string calldata studentId,
        Status status
    ) external onlyOwner onlyToken(token) {
        Session storage session = sessions[sessionId];
        require(session.exists, "unknown session");
        require(session.closedAt != 0, "session open");
        Record storage row = records[sessionId][studentId];
        require(row.exists, "unknown record");
        row.status = status;
    }

    function setJustification(
        string calldata token,
        string calldata sessionId,
        string calldata studentId,
        Justification justification,
        string calldata documentId
    ) external onlyOwner onlyToken(token) {
        Session storage session = sessions[sessionId];
        require(session.exists, "unknown session");
        require(session.closedAt != 0, "session open");
        Record storage row = records[sessionId][studentId];
        require(row.exists, "unknown record");
        if (justification == Justification.Justified) {
            require(bytes(documentId).length != 0, "file required");
        }
        row.justification = justification;
        row.documentId = documentId;
    }

    function getRecord(
        string calldata token,
        string calldata sessionId,
        string calldata studentId
    )
        external
        view
        onlyToken(token)
        returns (
            Status status,
            Justification justification,
            uint64 checkedInAt,
            CheckInMethod checkInMethod,
            uint64 noticedAt,
            string memory documentId
        )
    {
        require(sessions[sessionId].exists, "unknown session");
        Record storage row = records[sessionId][studentId];
        require(row.exists, "unknown record");
        return (
            row.status,
            row.justification,
            row.checkedInAt,
            row.checkInMethod,
            row.noticedAt,
            row.documentId
        );
    }
}
