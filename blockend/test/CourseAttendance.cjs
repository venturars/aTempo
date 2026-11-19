const { expect } = require("chai");
const { ethers } = require("hardhat");

const COURSE_ID = "11111111-1111-1111-1111-111111111111";
const SESSION_ID = "22222222-2222-2222-2222-222222222222";
const PROFESSOR_ID = "33333333-3333-3333-3333-333333333333";
const STUDENT_ID = "44444444-4444-4444-4444-444444444444";
const DOCUMENT_ID = "55555555-5555-5555-5555-555555555555";
const ACCESS_TOKEN = "curso-token";
const WRONG_TOKEN = "otro-token";

const Status = { Present: 0, PresentLate: 1, Absent: 2, NotifiedAbsence: 3 };
const Justification = { None: 0, Pending: 1, Justified: 2, Rejected: 3 };
const CheckInMethod = { None: 0, Button: 1, Qr: 2 };

function tokenHash(value) {
  return ethers.keccak256(ethers.toUtf8Bytes(value));
}

async function deployCourse() {
  const [owner, other] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("CourseAttendance");
  const contract = await factory.deploy(COURSE_ID, tokenHash(ACCESS_TOKEN));
  await contract.waitForDeployment();
  return { contract, owner, other };
}

function attendanceRow(overrides = {}) {
  return {
    studentId: STUDENT_ID,
    status: Status.Absent,
    justification: Justification.None,
    checkedInAt: 0,
    checkInMethod: CheckInMethod.None,
    noticedAt: 0,
    documentId: "",
    ...overrides,
  };
}

describe("CourseAttendance", () => {
  it("guarda el courseId inmutable y lo lee con getCourseId", async () => {
    const { contract } = await deployCourse();
    expect(await contract.getCourseId(ACCESS_TOKEN)).to.equal(COURSE_ID);
    expect(() => contract.interface.getFunction("courseId()")).to.throw;
  });

  it("createSession no sobrescribe un id ya escrito", async () => {
    const { contract } = await deployCourse();
    await contract.createSession(ACCESS_TOKEN, SESSION_ID, 1, 2, PROFESSOR_ID);
    await expect(
      contract.createSession(ACCESS_TOKEN, SESSION_ID, 3, 4, PROFESSOR_ID)
    ).to.be.revertedWith("session exists");
    const session = await contract.getSession(ACCESS_TOKEN, SESSION_ID);
    expect(session.startAt).to.equal(1n);
    expect(session.professorId).to.equal(PROFESSOR_ID);
  });

  it("closeSession escribe closedAt y las fichas en una transacción e ignora el segundo cierre", async () => {
    const { contract } = await deployCourse();
    await contract.createSession(ACCESS_TOKEN, SESSION_ID, 1, 2, PROFESSOR_ID);

    const tx = await contract.closeSession(ACCESS_TOKEN, SESSION_ID, 10, 15, [
      attendanceRow(),
    ]);
    const receipt = await tx.wait();
    const parsed = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    expect(parsed).to.deep.equal([]);

    await contract.closeSession(ACCESS_TOKEN, SESSION_ID, 99, 1, []);
    const session = await contract.getSession(ACCESS_TOKEN, SESSION_ID);
    expect(session.closedAt).to.equal(10n);
    expect(session.lateAfterMinutes).to.equal(15);
    expect(session.professorId).to.equal(PROFESSOR_ID);

    const record = await contract.getRecord(ACCESS_TOKEN, SESSION_ID, STUDENT_ID);
    expect(record.status).to.equal(Status.Absent);
  });

  it("changeStatus y setJustification no tocan la sesión", async () => {
    const { contract } = await deployCourse();
    await contract.createSession(ACCESS_TOKEN, SESSION_ID, 1, 2, PROFESSOR_ID);
    await contract.closeSession(ACCESS_TOKEN, SESSION_ID, 10, 15, [
      attendanceRow({
        justification: Justification.Pending,
        noticedAt: 5,
        documentId: DOCUMENT_ID,
      }),
    ]);

    await contract.changeStatus(ACCESS_TOKEN, SESSION_ID, STUDENT_ID, Status.PresentLate);
    await contract.setJustification(
      ACCESS_TOKEN,
      SESSION_ID,
      STUDENT_ID,
      Justification.Justified,
      DOCUMENT_ID
    );

    const session = await contract.getSession(ACCESS_TOKEN, SESSION_ID);
    expect(session.startAt).to.equal(1n);
    expect(session.endAt).to.equal(2n);
    expect(session.closedAt).to.equal(10n);
    expect(session.professorId).to.equal(PROFESSOR_ID);

    const record = await contract.getRecord(ACCESS_TOKEN, SESSION_ID, STUDENT_ID);
    expect(record.status).to.equal(Status.PresentLate);
    expect(record.justification).to.equal(Justification.Justified);
    expect(record.documentId).to.equal(DOCUMENT_ID);
  });

  it("justified exige archivo", async () => {
    const { contract } = await deployCourse();
    await contract.createSession(ACCESS_TOKEN, SESSION_ID, 1, 2, PROFESSOR_ID);
    await contract.closeSession(ACCESS_TOKEN, SESSION_ID, 10, 15, [
      attendanceRow({ justification: Justification.Pending }),
    ]);

    await expect(
      contract.setJustification(
        ACCESS_TOKEN,
        SESSION_ID,
        STUDENT_ID,
        Justification.Justified,
        ""
      )
    ).to.be.revertedWith("file required");
  });

  it("un token incorrecto revierte en getters y escrituras", async () => {
    const { contract } = await deployCourse();
    await expect(contract.getCourseId(WRONG_TOKEN)).to.be.revertedWith("unauthorized");
    await expect(
      contract.createSession(WRONG_TOKEN, SESSION_ID, 1, 2, PROFESSOR_ID)
    ).to.be.revertedWith("unauthorized");
  });

  it("un address que no es owner no escribe aunque lleve el token", async () => {
    const { contract, other } = await deployCourse();
    await expect(
      contract.connect(other).createSession(ACCESS_TOKEN, SESSION_ID, 1, 2, PROFESSOR_ID)
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("transferOwnership y renounceOwnership se anulan", async () => {
    const { contract, other } = await deployCourse();
    await expect(contract.transferOwnership(other.address)).to.be.revertedWith(
      "ownership locked"
    );
    await expect(contract.renounceOwnership()).to.be.revertedWith("ownership locked");
  });
});
