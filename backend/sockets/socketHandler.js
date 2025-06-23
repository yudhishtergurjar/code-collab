const jwt = require('jsonwebtoken');
const { Room } = require('../db');

const activeUsers = new Map();

const setupSocketHandlers = (io) => {

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', async (data) => {
      try {
        const { roomId, token } = data;

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const room = await Room.findOne({ roomId });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);

        activeUsers.set(socket.id, {
          userId: decoded.userId,
          username: decoded.username,
          roomId
        });

        // Send current code to the newly joined user
        socket.emit('code-update', {
          code: room.code,
          language: room.language
        });

        // Notify all users in the room about the new user
        io.to(roomId).emit('user-joined', {
          username: decoded.username,
          message: `${decoded.username} joined the room`,
          users: Array.from(activeUsers.values())
            .filter(u => u.roomId === roomId)
            .map(u => u.username)
        });

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    socket.on('code-change', async (data) => {
      try {
        const user = activeUsers.get(socket.id);
        if (!user) return;

        const { code, language } = data;

        // Update room in database
        await Room.findOneAndUpdate(
          { roomId: user.roomId },
          { code, language },
          { new: true }
        );

        // Broadcast to other users in room
        socket.to(user.roomId).emit('code-update', {
          code,
          language,
          updatedBy: user.username
        });
      } catch (error) {
        console.error('Code change error:', error);
      }
    });

    socket.on('cursor-position', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      socket.to(user.roomId).emit('cursor-update', {
        username: user.username,
        position: data.position
      });
    });

    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        activeUsers.delete(socket.id);

        const roomUsers = Array.from(activeUsers.values())
          .filter(u => u.roomId === user.roomId)
          .map(u => u.username);

        // Inform others in the room
        io.to(user.roomId).emit('user-left', {
          username: user.username,
          message: `${user.username} left the room`,
          users: roomUsers
        });
      }

      console.log('User disconnected:', socket.id);
    });
  });

};

module.exports = setupSocketHandlers;