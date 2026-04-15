const crypto = require("crypto");
const AttendanceSession = require("../models/AttendanceSession");
const ClassSection = require("../models/ClassSection");
const AttendanceRecord = require("../models/AttendanceRecord");
const asyncHandler = require("../utils/asyncHandler");
const { generateEncryptedQR } = require("../utils/qr");

const startSession = (io) =>
  asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { expiresInMinutes = 3 } = req.body;

    const classSection = await ClassSection.findOne({
      _id: classId,
      teacher: req.user._id,
    }).populate("subject", "_id name code");

    if (!classSection) {
      res.status(404);
      throw new Error("Class not found");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(expiresInMinutes) * 60 * 1000);

    const session = await AttendanceSession.create({
      subject: classSection.subject._id,
      classSection: classSection._id,
      teacher: req.user._id,
      startedAt: now,
      expiresAt,
      nonce: crypto.randomUUID(),
    });

    const payload = {
      sessionId: String(session._id),
      classId: String(classSection._id),
      subjectId: String(classSection.subject._id),
      nonce: session.nonce,
      ts: Date.now(),
      exp: expiresAt.getTime(),
    };

    const { encryptedPayload, qrCodeDataUrl } = await generateEncryptedQR(payload);

    io.to(`session:${session._id}`).emit("sessionStarted", {
      sessionId: session._id,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
    });

    return res.status(201).json({
      session,
      qrCodeDataUrl,
      encryptedPayload,
    });
  });

const getLiveSession = asyncHandler(async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId)
    .populate("subject", "name code")
    .populate("classSection", "name section students")
    .populate("teacher", "name email");

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (String(session.teacher._id) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You cannot access this session");
  }

  const records = await AttendanceRecord.find({ session: session._id }).populate(
    "student",
    "name email collegeId"
  );

  let qrCodeDataUrl = null;
  let encryptedPayload = null;

  if (session.status === "active" && new Date() <= new Date(session.expiresAt)) {
    const payload = {
      sessionId: String(session._id),
      classId: String(session.classSection._id),
      subjectId: String(session.subject._id),
      nonce: session.nonce,
      ts: Date.now(),
      exp: new Date(session.expiresAt).getTime(),
    };

    const generated = await generateEncryptedQR(payload);
    qrCodeDataUrl = generated.qrCodeDataUrl;
    encryptedPayload = generated.encryptedPayload;
  }

  return res.json({ session, records, qrCodeDataUrl, encryptedPayload });
});

const endSession = (io) =>
  asyncHandler(async (req, res) => {
    const session = await AttendanceSession.findById(req.params.sessionId)
      .populate("classSection", "students")
      .populate("subject", "name code");

    if (!session) {
      res.status(404);
      throw new Error("Session not found");
    }

    if (String(session.teacher) !== String(req.user._id) && req.user.role !== "admin") {
      res.status(403);
      throw new Error("You cannot end this session");
    }

    if (session.status === "ended") {
      return res.json({ message: "Session already ended", session });
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    const records = await AttendanceRecord.find({ session: session._id }).select("student");
    const presentIds = new Set(records.map((r) => String(r.student)));
    const totalStudents = session.classSection.students.length;
    const presentCount = presentIds.size;
    const absentCount = totalStudents - presentCount;

    io.to(`session:${session._id}`).emit("sessionEnded", {
      sessionId: session._id,
      endedAt: session.endedAt,
    });

    return res.json({
      message: "Session ended successfully",
      session,
      report: {
        totalStudents,
        presentCount,
        absentCount,
        attendancePercentage: totalStudents
          ? Number(((presentCount / totalStudents) * 100).toFixed(2))
          : 0,
      },
    });
  });

module.exports = { startSession, getLiveSession, endSession };
