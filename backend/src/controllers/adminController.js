const User = require("../models/User");
const Subject = require("../models/Subject");
const ClassSection = require("../models/ClassSection");
const AttendanceSession = require("../models/AttendanceSession");
const asyncHandler = require("../utils/asyncHandler");

const getAdminSummary = asyncHandler(async (req, res) => {
  const [students, teachers, subjects, classes, sessions] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    Subject.countDocuments(),
    ClassSection.countDocuments(),
    AttendanceSession.countDocuments(),
  ]);

  return res.json({ students, teachers, subjects, classes, sessions });
});

module.exports = { getAdminSummary };
