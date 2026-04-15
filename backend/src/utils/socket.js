const jwt = require("jsonwebtoken");

const setupSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinSession", (sessionId) => {
      socket.join(`session:${sessionId}`);
    });

    socket.on("leaveSession", (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });
  });
};

module.exports = setupSocket;
