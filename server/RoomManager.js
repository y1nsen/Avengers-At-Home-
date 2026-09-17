// Authoritative 1v1 Room Manager (Simplified - No Reconnect/Host Migration)
export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> roomData
  }

  generateRoomCode() {
    let code;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(socket, username) {
    const code = this.generateRoomCode();

    const room = {
      code,
      hostId: socket.id,
      players: {
        [socket.id]: {
          seat: 'player1',
          username: username || 'Player 1',
          socketId: socket.id,
          squad: []
        }
      },
      state: 'LOBBY',
      gameState: null
    };

    this.rooms.set(code, room);
    socket.join(code);

    return { code, seat: 'player1' };
  }

  joinRoom(code, socket, username) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };

    const playerCount = Object.keys(room.players).length;
    if (playerCount >= 2) return { error: 'Room is full' };

    const seat = 'player2';

    room.players[socket.id] = {
      seat,
      username: username || 'Player 2',
      socketId: socket.id,
      squad: []
    };
    socket.join(code);

    this.io.to(code).emit('PLAYER_JOINED', {
      seat,
      username: username || 'Player 2',
      players: Object.values(room.players).map(p => ({ seat: p.seat, username: p.username }))
    });

    return { code, seat };
  }

  handleDisconnect(socket) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players[socket.id];
      if (player) {
        console.log(`[Server] Player disconnected: ${player.username} from room #${code}. Aborting match.`);
        this.io.to(code).emit('MATCH_ABORTED', {
          reason: `${player.username} disconnected. Match ended.`
        });
        this.rooms.delete(code);
        break;
      }
    }
  }

  updateGameState(code, gameState) {
    const room = this.rooms.get(code);
    if (room) {
      room.gameState = gameState;
      this.io.to(code).emit('GAME_STATE_SYNC', gameState);
    }
  }
}
