const express = require("express");
const {
  createClass,
  getTeacherClasses,
  getStudentClasses,
} = require("../controllers/classController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("teacher"), createClass);
router.get("/teacher", protect, authorize("teacher", "admin"), getTeacherClasses);
router.get("/student", protect, authorize("student"), getStudentClasses);

module.exports = router;
