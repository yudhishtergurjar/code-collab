const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const setupSocketHandlers = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { 
    origin: [
      "http://localhost:3000",
      "https://cd-collab-frontend-rn7vcb5wr-yudhishters-projects.vercel.app"
    ], 
    methods: ["GET", "POST"] 
  }
});

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://cd-collab-frontend-rn7vcb5wr-yudhishters-projects.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// DB
connectDB();

// Routes
app.use('/api', authRoutes);
app.use('/api/rooms', roomRoutes);

// Socket
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});