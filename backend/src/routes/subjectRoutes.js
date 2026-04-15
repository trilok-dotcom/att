const express = require("express");
const {
  createSubject,
  getTeacherSubjects,
  getStudentSubjects,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("teacher"), createSubject);
router.get("/teacher", protect, authorize("teacher", "admin"), getTeacherSubjects);
router.get("/student", protect, authorize("student"), getStudentSubjects);

module.exports = router;
