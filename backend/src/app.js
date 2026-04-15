const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const classRoutes = require("./routes/classRoutes");
const sessionRoutesFactory = require("./routes/sessionRoutes");
const attendanceRoutesFactory = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");

const { errorHandler } = require("./middleware/errorMiddleware");
const sessionControllerFactory = require("./controllers/sessionController");
const attendanceControllerFactory = require("./controllers/attendanceController");

const createApp = (io) => {
  const app = express();

  const allowedOrigins = (
    process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS not allowed"));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  const sessionController = {
    startSession: sessionControllerFactory.startSession(io),
    getLiveSession: sessionControllerFactory.getLiveSession,
    endSession: sessionControllerFactory.endSession(io),
  };

  const attendanceController = {
    markAttendance: attendanceControllerFactory.markAttendance(io),
    markAttendanceManually: attendanceControllerFactory.markAttendanceManually(io),
    searchSessionStudents: attendanceControllerFactory.searchSessionStudents,
    getStudentAttendanceHistory:
      attendanceControllerFactory.getStudentAttendanceHistory,
  };

  app.get("/api/health", (req, res) => {
    res.json({ message: "API running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/subjects", subjectRoutes);
  app.use("/api/classes", classRoutes);
  app.use("/api/sessions", sessionRoutesFactory(sessionController));
  app.use("/api/attendance", attendanceRoutesFactory(attendanceController));
  app.use("/api/reports", reportRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
