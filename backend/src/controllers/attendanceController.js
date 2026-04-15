const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const ClassSection = require("../models/ClassSection");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { decryptPayload } = require("../utils/crypto");

const markAttendance = (io) =>
  asyncHandler(async (req, res) => {
    const { encryptedPayload } = req.body;

    if (!encryptedPayload) {
      res.status(400);
      throw new Error("Encrypted payload is required");
    }

    const payload = decryptPayload(encryptedPayload);
    if (!payload) {
      res.status(400);
      throw new Error("Invalid QR payload");
    }

    const { sessionId, classId, subjectId, nonce, exp } = payload;

    if (Date.now() > Number(exp)) {
      res.status(400);
      throw new Error("QR code expired. Ask teacher for a fresh QR");
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error("Session not found");
    }

    if (session.status !== "active") {
      res.status(400);
      throw new Error("Session is not active");
    }

    if (new Date() > session.expiresAt) {
      res.status(400);
      throw new Error("Session QR window is closed");
    }

    if (
      String(session.classSection) !== String(classId) ||
      String(session.subject) !== String(subjectId) ||
      session.nonce !== nonce
    ) {
      res.status(400);
      throw new Error("Tampered or mismatched QR payload");
    }

    const classSection = await ClassSection.findById(classId);
    if (!classSection) {
      res.status(404);
      throw new Error("Class section missing");
    }

    const isEnrolled = classSection.students.some(
      (studentId) => String(studentId) === String(req.user._id)
    );

    if (!isEnrolled) {
      res.status(403);
      throw new Error("Student is not enrolled in this class");
    }

    const alreadyMarked = await AttendanceRecord.findOne({
      session: sessionId,
      student: req.user._id,
    });

    if (alreadyMarked) {
      res.status(409);
      throw new Error("Attendance already marked for this session");
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const markedInLastHour = await AttendanceRecord.findOne({
      subject: subjectId,
      student: req.user._id,
      markedAt: { $gte: oneHourAgo },
    });

    if (markedInLastHour) {
      res.status(409);
      throw new Error("Attendance for this subject already marked within 1 hour");
    }

    const record = await AttendanceRecord.create({
      session: sessionId,
      subject: subjectId,
      classSection: classId,
      student: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    io.to(`session:${sessionId}`).emit("attendanceMarked", {
      sessionId,
      student: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        collegeId: req.user.collegeId,
      },
      markedAt: record.markedAt,
    });

    return res.status(201).json({ message: "Attendance marked", record });
  });

const getStudentAttendanceHistory = asyncHandler(async (req, res) => {
  const records = await AttendanceRecord.find({ student: req.user._id })
    .sort({ markedAt: -1 })
    .populate("subject", "name code")
    .populate("classSection", "name section")
    .populate("session", "startedAt endedAt status");

  return res.json(records);
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchSessionStudents = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const q = (req.query.q || "").trim().toLowerCase();

  const session = await AttendanceSession.findById(sessionId).populate(
    "classSection",
    "students teacher"
  );

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (String(session.teacher) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You cannot access this session");
  }

  const studentIds = session.classSection?.students || [];
  const filter = { _id: { $in: studentIds }, role: "student" };

  if (q) {
    filter.email = { $regex: `^${escapeRegex(q)}@`, $options: "i" };
  }

  const students = await User.find(filter)
    .select("name email collegeId")
    .sort({ name: 1 })
    .limit(20);

  const existingRecords = await AttendanceRecord.find({
    session: sessionId,
    student: { $in: students.map((s) => s._id) },
  }).select("student");

  const markedSet = new Set(existingRecords.map((r) => String(r.student)));

  const results = students.map((student) => ({
    id: student._id,
    name: student.name,
    email: student.email,
    usn: (student.email || "").split("@")[0],
    collegeId: student.collegeId,
    alreadyMarked: markedSet.has(String(student._id)),
  }));

  return res.json(results);
});

const markAttendanceManually = (io) =>
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      res.status(400);
      throw new Error("studentId is required");
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error("Session not found");
    }

    if (String(session.teacher) !== String(req.user._id) && req.user.role !== "admin") {
      res.status(403);
      throw new Error("You cannot mark attendance for this session");
    }

    if (session.status !== "active") {
      res.status(400);
      throw new Error("Session is not active");
    }

    const classSection = await ClassSection.findById(session.classSection);
    if (!classSection) {
      res.status(404);
      throw new Error("Class section missing");
    }

    const isEnrolled = classSection.students.some(
      (id) => String(id) === String(studentId)
    );

    if (!isEnrolled) {
      res.status(403);
      throw new Error("Student is not enrolled in this class");
    }

    const student = await User.findOne({ _id: studentId, role: "student" }).select(
      "name email collegeId"
    );
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const alreadyMarked = await AttendanceRecord.findOne({
      session: sessionId,
      student: studentId,
    });

    if (alreadyMarked) {
      res.status(409);
      throw new Error("Attendance already marked for this session");
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const markedInLastHour = await AttendanceRecord.findOne({
      subject: session.subject,
      student: studentId,
      markedAt: { $gte: oneHourAgo },
    });

    if (markedInLastHour) {
      res.status(409);
      throw new Error("Attendance for this subject already marked within 1 hour");
    }

    const record = await AttendanceRecord.create({
      session: sessionId,
      subject: session.subject,
      classSection: session.classSection,
      student: studentId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    io.to(`session:${sessionId}`).emit("attendanceMarked", {
      sessionId,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        collegeId: student.collegeId,
      },
      markedAt: record.markedAt,
    });

    return res.status(201).json({ message: "Attendance marked", record });
  });

module.exports = {
  markAttendance,
  getStudentAttendanceHistory,
  searchSessionStudents,
  markAttendanceManually,
};
