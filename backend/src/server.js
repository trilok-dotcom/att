require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const createApp = require("./app");
const setupSocket = require("./utils/socket");

const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

allowedOrigins.push("https://newatt.netlify.app");
allowedOrigins.push("https://newatt.netlify.app/");

(async () => {
  await connectDB();

  const io = new Server({
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupSocket(io);

  const app = createApp(io);
  const server = http.createServer(app);
  
  io.attach(server);

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
