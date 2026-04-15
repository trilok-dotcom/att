const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const attendanceRoutes = (attendanceController) => {
  const router = express.Router();

  router.post("/scan", protect, authorize("student"), attendanceController.markAttendance);
  router.get(
    "/history/student",
    protect,
    authorize("student"),
    attendanceController.getStudentAttendanceHistory
  );
  router.get(
    "/session/:sessionId/students/search",
    protect,
    authorize("teacher", "admin"),
    attendanceController.searchSessionStudents
  );
  router.post(
    "/session/:sessionId/mark",
    protect,
    authorize("teacher", "admin"),
    attendanceController.markAttendanceManually
  );

  return router;
};

module.exports = attendanceRoutes;
