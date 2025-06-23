const express = require('express');
const { Room } = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new Room({ roomId, createdBy: req.user.userId, participants: [req.user.userId] });
    await room.save();
    res.status(201).json({ message: 'Room created', roomId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (!room.participants.includes(req.user.userId)) {
      room.participants.push(req.user.userId);
      await room.save();
    }

    res.json({ message: 'Joined room', room: { roomId, code: room.code, language: room.language } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;