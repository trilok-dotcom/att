const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const sessionRoutes = (sessionController) => {
  const router = express.Router();

  router.post("/start/:classId", protect, authorize("teacher"), sessionController.startSession);
  router.get("/:sessionId/live", protect, authorize("teacher", "admin"), sessionController.getLiveSession);
  router.post("/:sessionId/end", protect, authorize("teacher", "admin"), sessionController.endSession);

  return router;
};

module.exports = sessionRoutes;
