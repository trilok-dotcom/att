const express = require("express");
const { getAdminSummary } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/summary", protect, authorize("admin"), getAdminSummary);

module.exports = router;
