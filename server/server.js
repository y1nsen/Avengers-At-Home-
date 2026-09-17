// Express + Socket.io Server Entry Point
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', rooms: roomManager.rooms.size });
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('CREATE_ROOM', ({ username }, callback) => {
    const res = roomManager.createRoom(socket, username);
    callback(res);
  });

  socket.on('JOIN_ROOM', ({ roomCode, username }, callback) => {
    const res = roomManager.joinRoom(roomCode, socket, username);
    callback(res);
  });

  socket.on('SYNC_GAME_STATE', ({ roomCode, gameState }) => {
    roomManager.updateGameState(roomCode, gameState);
  });

  socket.on('ACTION_DECLARED', ({ roomCode, action }) => {
    socket.to(roomCode).emit('OPPONENT_ACTION', action);
  });

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`[Server] Avengers Assemble Server running on http://localhost:${PORT}`);
});
