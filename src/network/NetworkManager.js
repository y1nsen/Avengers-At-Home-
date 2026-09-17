// Client-Side Socket.io & Session Persistence Manager
import { io } from 'socket.io-client';

export class NetworkManager {
  constructor(serverUrl = 'http://localhost:4000') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.roomCode = null;
    this.sessionToken = null;
    this.seat = null;
    this.callbacks = {};
  }

  connect() {
    this.socket = io(this.serverUrl, { reconnectionAttempts: 5 });

    this.socket.on('connect', () => {
      console.log('[Network] Connected to multiplayer server.');
    });

    this.socket.on('PLAYER_JOINED', data => this.trigger('playerJoined', data));
    this.socket.on('GAME_STATE_SYNC', state => this.trigger('gameStateSync', state));
    this.socket.on('OPPONENT_ACTION', action => this.trigger('opponentAction', action));
    this.socket.on('MATCH_ABORTED', data => this.trigger('matchAborted', data));
  }

  on(event, cb) {
    this.callbacks[event] = cb;
  }

  trigger(event, data) {
    if (this.callbacks[event]) this.callbacks[event](data);
  }

  createRoom(username) {
    return new Promise((resolve, reject) => {
      this.socket.emit('CREATE_ROOM', { username }, res => {
        if (res.error) return reject(res.error);
        this.roomCode = res.code;
        this.seat = res.seat;
        resolve(res);
      });
    });
  }

  joinRoom(roomCode, username) {
    return new Promise((resolve, reject) => {
      this.socket.emit('JOIN_ROOM', { roomCode, username }, res => {
        if (res.error) return reject(res.error);
        this.roomCode = res.code;
        this.seat = res.seat;
        resolve(res);
      });
    });
  }

  sendAction(action) {
    if (this.socket && this.roomCode) {
      this.socket.emit('ACTION_DECLARED', { roomCode: this.roomCode, action });
    }
  }

  syncGameState(gameState) {
    if (this.socket && this.roomCode) {
      this.socket.emit('SYNC_GAME_STATE', { roomCode: this.roomCode, gameState });
    }
  }
}
