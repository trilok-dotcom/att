const ClassSection = require("../models/ClassSection");
const Subject = require("../models/Subject");
const asyncHandler = require("../utils/asyncHandler");

const createClass = asyncHandler(async (req, res) => {
  const { name, section, subjectId, students = [] } = req.body;

  const subject = await Subject.findOne({ _id: subjectId, teacher: req.user._id });
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found for this teacher");
  }

  const classSection = await ClassSection.create({
    name,
    section,
    subject: subjectId,
    teacher: req.user._id,
    students,
  });

  return res.status(201).json(classSection);
});

const getTeacherClasses = asyncHandler(async (req, res) => {
  const classes = await ClassSection.find({ teacher: req.user._id })
    .populate("subject", "name code")
    .populate("students", "name email collegeId");

  return res.json(classes);
});

const getStudentClasses = asyncHandler(async (req, res) => {
  const classes = await ClassSection.find({ students: req.user._id })
    .populate("subject", "name code")
    .populate("teacher", "name email");

  return res.json(classes);
});

module.exports = { createClass, getTeacherClasses, getStudentClasses };
