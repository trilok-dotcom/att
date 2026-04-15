const express = require("express");
const {
  getSessionReport,
  exportSessionCsv,
  analytics,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/session/:sessionId", protect, authorize("teacher", "admin"), getSessionReport);
router.get(
  "/session/:sessionId/csv",
  protect,
  authorize("teacher", "admin"),
  exportSessionCsv
);
router.get("/analytics", protect, authorize("admin", "teacher"), analytics);

module.exports = router;
