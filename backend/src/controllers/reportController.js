const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const getSessionReport = asyncHandler(async (req, res) => {
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
    throw new Error("Not allowed to access this report");
  }

  const records = await AttendanceRecord.find({ session: session._id }).populate(
    "student",
    "name email collegeId"
  );

  const presentStudentIds = new Set(records.map((r) => String(r.student._id)));
  const students = await User.find({ _id: { $in: session.classSection.students } }).select(
    "name email collegeId"
  );

  const present = students.filter((s) => presentStudentIds.has(String(s._id)));
  const absent = students.filter((s) => !presentStudentIds.has(String(s._id)));

  const totalStudents = students.length;
  const presentCount = present.length;
  const absentCount = absent.length;

  return res.json({
    session,
    summary: {
      totalStudents,
      presentCount,
      absentCount,
      attendancePercentage: totalStudents
        ? Number(((presentCount / totalStudents) * 100).toFixed(2))
        : 0,
    },
    present,
    absent,
  });
});

const exportSessionCsv = asyncHandler(async (req, res) => {
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
    throw new Error("Not allowed to export this report");
  }

  const records = await AttendanceRecord.find({ session: session._id }).populate(
    "student",
    "name email collegeId"
  );

  const presentStudentIds = new Set(records.map((r) => String(r.student._id)));
  const students = await User.find({ _id: { $in: session.classSection.students } }).select(
    "name email collegeId"
  );

  const rows = students.map((student) => {
    const present = presentStudentIds.has(String(student._id));
    return {
      name: student.name,
      email: student.email,
      collegeId: student.collegeId || "",
      status: present ? "Present" : "Absent",
      markedAt: present
        ? records.find((r) => String(r.student._id) === String(student._id))?.markedAt
        : "",
    };
  });

  const tempDir = path.join(__dirname, "../../tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const fileName = `attendance-${session._id}.csv`;
  const filePath = path.join(tempDir, fileName);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "name", title: "Name" },
      { id: "email", title: "Email" },
      { id: "collegeId", title: "College ID" },
      { id: "status", title: "Status" },
      { id: "markedAt", title: "Marked At" },
    ],
  });

  await csvWriter.writeRecords(rows);

  return res.download(filePath, fileName, (err) => {
    if (!err && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
});

const analytics = asyncHandler(async (req, res) => {
  const grouped = await AttendanceRecord.aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subject",
        foreignField: "_id",
        as: "subjectDoc",
      },
    },
    { $unwind: "$subjectDoc" },
    {
      $group: {
        _id: "$subjectDoc.code",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return res.json(grouped);
});

module.exports = { getSessionReport, exportSessionCsv, analytics };
