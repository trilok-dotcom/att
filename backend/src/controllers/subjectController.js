const Subject = require("../models/Subject");
const asyncHandler = require("../utils/asyncHandler");

const createSubject = asyncHandler(async (req, res) => {
  const { name, code, students = [] } = req.body;

  const subject = await Subject.create({
    name,
    code,
    teacher: req.user._id,
    students,
  });

  return res.status(201).json(subject);
});

const getTeacherSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ teacher: req.user._id }).populate(
    "students",
    "name email collegeId"
  );
  return res.json(subjects);
});

const getStudentSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ students: req.user._id }).populate(
    "teacher",
    "name email"
  );
  return res.json(subjects);
});

module.exports = { createSubject, getTeacherSubjects, getStudentSubjects };
