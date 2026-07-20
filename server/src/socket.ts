import { Server, Socket } from 'socket.io';
import { GameManager } from './GameManager';
import * as imageProxy from './imageProxy';

const DISCONNECT_GRACE_MS = 10_000;

export function setupSocket(io: Server): GameManager {
  const gameManager = new GameManager();
  const activeTimers = new Set<string>();
  const pendingDisconnects = new Map<string, NodeJS.Timeout>();

  function clearTimeoutIfExists(socketId: string) {
    const timer = pendingDisconnects.get(socketId);
    if (timer) {
      clearTimeout(timer);
      pendingDisconnects.delete(socketId);
    }
  }

  io.on('connection', (socket: Socket) => {
    console.log(`[+] ${socket.id} connected`);
    clearTimeoutIfExists(socket.id);

    socket.on('create_room', (callback: (res: { code: string }) => void) => {
      const code = gameManager.createRoom();
      callback({ code });
    });

    socket.on('join_room', (data: { code: string; username: string }, callback: (res: { success: boolean; playerId?: string; error?: string }) => void) => {
      const { code, username } = data;
      const player = gameManager.addPlayer(code, username, socket.id);
      if (!player) {
        const room = gameManager.getRoom(code);
        if (!room) return callback({ success: false, error: 'Sala no encontrada' });
        if (room.players.length >= 8) return callback({ success: false, error: 'Sala llena (máx 8)' });
        if (room.phase !== 'waiting') return callback({ success: false, error: 'La partida ya comenzó' });
        return callback({ success: false, error: 'Nombre inválido (2-20 caracteres)' });
      }

      socket.join(code);
      callback({ success: true, playerId: player.id });
      io.to(code).emit('room_update', gameManager.getPublicRoomState(code));
    });

    socket.on('start_game', (_data: unknown, callback: (res: { success: boolean; error?: string }) => void) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) return callback({ success: false, error: 'No estás en una sala' });
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player?.isHost) return callback({ success: false, error: 'Solo el host puede iniciar' });
      const success = gameManager.startGame(room.code);
      if (!success) return callback({ success: false, error: 'No se puede iniciar (mín 2 jugadores)' });
      callback({ success: true });
      io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
      io.to(room.code).emit('phase_change', 'prompt_writing');
      ensureTimerLoop(io, gameManager, room.code, activeTimers);
    });

    socket.on('set_max_rounds', (data: { maxRounds: number }, callback: (res: { success: boolean; error?: string }) => void) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) return callback({ success: false, error: 'No estás en una sala' });
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player?.isHost) return callback({ success: false, error: 'Solo el host puede cambiar rondas' });
      const success = gameManager.setMaxRounds(room.code, data.maxRounds);
      if (!success) return callback({ success: false, error: 'Número de rondas inválido (2-5)' });
      callback({ success: true });
      io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
    });

    socket.on('submit_prompt', (data: { prompt: string }, callback: (res: { success: boolean }) => void) => {
      const success = gameManager.submitPrompt(socket.id, data.prompt);
      callback({ success });

      const room = gameManager.getRoomBySocket(socket.id);
      if (room) {
        io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
        if (gameManager.allPromptsSubmitted(room.code)) {
          gameManager.startGeneratingPhase(room.code);
          io.to(room.code).emit('phase_change', 'generating');
          io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
          generateImages(io, gameManager, room.code);
        }
      }
    });

    socket.on('submit_vote', (data: { targetId: string }, callback: (res: { success: boolean; error?: string }) => void) => {
      const success = gameManager.submitVote(socket.id, data.targetId);
      if (!success) return callback({ success: false, error: 'Voto inválido' });
      callback({ success: true });

      const room = gameManager.getRoomBySocket(socket.id);
      if (room) {
        io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
        if (gameManager.allVotesSubmitted(room.code)) {
          endVotingPhase(io, gameManager, room.code);
        }
      }
    });

    socket.on('advance_reveal', () => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room || room.phase !== 'reveal') return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player?.isHost) return;
      advanceAfterReveal(io, gameManager, room.code);
    });

    socket.on('chat_message', (data: { roomCode: string; text: string }) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;
      if (typeof data.text !== 'string' || data.text.trim().length === 0 || data.text.length > 200) return;
      const msg = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, username: player.username, text: data.text.trim(), timestamp: Date.now() };
      io.to(room.code).emit('chat_message', msg);
    });

    socket.on('leave_room', () => {
      clearTimeoutIfExists(socket.id);
      const { roomCode } = gameManager.removePlayer(socket.id);
      if (roomCode) {
        io.to(roomCode).emit('room_update', gameManager.getPublicRoomState(roomCode));
        socket.leave(roomCode);
        const room = gameManager.getRoom(roomCode);
        if (!room) imageProxy.clearRoom(roomCode);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[-] ${socket.id} disconnected`);
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) return;

      const roomCode = room.code;
      const timer = setTimeout(() => {
        pendingDisconnects.delete(socket.id);
        const { roomCode: rc } = gameManager.removePlayer(socket.id);
        if (rc) {
          socket.leave(rc);
          const r = gameManager.getRoom(rc);
          if (!r) imageProxy.clearRoom(rc);
          io.to(rc).emit('room_update', gameManager.getPublicRoomState(rc));
        }
      }, DISCONNECT_GRACE_MS);

      pendingDisconnects.set(socket.id, timer);
    });
  });

  return gameManager;
}

function ensureTimerLoop(io: Server, gm: GameManager, code: string, activeTimers: Set<string>) {
  if (activeTimers.has(code)) return;
  startTimerLoop(io, gm, code, activeTimers);
}

function startTimerLoop(io: Server, gm: GameManager, code: string, activeTimers: Set<string>) {
  activeTimers.add(code);

  const tick = () => {
    const room = gm.getRoom(code);
    if (!room || room.phase === 'finished' || room.phase === 'waiting') {
      activeTimers.delete(code);
      return;
    }

    const remaining = room.timerEndsAt ? Math.max(0, Math.ceil((room.timerEndsAt - Date.now()) / 1000)) : 0;
    io.to(code).emit('timer_tick', remaining);

    if (remaining <= 0) {
      handlePhaseTimeout(io, gm, code);
    }

    setTimeout(tick, 1000);
  };
  tick();
}

function handlePhaseTimeout(io: Server, gm: GameManager, code: string) {
  const room = gm.getRoom(code);
  if (!room) return;

  console.log(`[handlePhaseTimeout] TIMEOUT for phase=${room.phase}, room=${code}`);

  switch (room.phase) {
    case 'prompt_writing':
      gm.startGeneratingPhase(code);
      io.to(code).emit('phase_change', 'generating');
      io.to(code).emit('room_update', gm.getPublicRoomState(code));
      generateImages(io, gm, code);
      break;
    case 'generating':
      gm.startVotingPhase(code);
      io.to(code).emit('phase_change', 'voting');
      io.to(code).emit('room_update', gm.getPublicRoomState(code));
      break;
    case 'voting':
      endVotingPhase(io, gm, code);
      break;
    case 'reveal':
      advanceAfterReveal(io, gm, code);
      break;
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function generateImages(io: Server, gm: GameManager, code: string) {
  const room = gm.getRoom(code);
  if (!room) return;

  console.log(`[generateImages] START: prompts=${room.prompts.length}, phase=${room.phase}`);

  const imageEntries: { playerId: string; imageUrl: string }[] = [];

  for (const p of room.prompts) {
    const hash = String(hashString(p.prompt + code));
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(p.prompt)}?width=400&height=400&seed=${hash}&nologo=true`;
    const internalUrl = `/api/images/${code}/${hash}`;

    imageEntries.push({ playerId: p.playerId, imageUrl: internalUrl });

    imageProxy.fetchAndCache(code, hash, pollinationsUrl).then(success => {
      if (success) {
        io.to(code).emit('room_update', gm.getPublicRoomState(code));
        const r = gm.getRoom(code);
        if (r && r.phase === 'generating' && gm.allImagesSubmitted(code)) {
          gm.startVotingPhase(code);
          io.to(code).emit('phase_change', 'voting');
          io.to(code).emit('room_update', gm.getPublicRoomState(code));
        }
      }
    });
  }

  gm.submitImages(code, imageEntries);
  io.to(code).emit('room_update', gm.getPublicRoomState(code));
}

function endVotingPhase(io: Server, gm: GameManager, code: string) {
  gm.awardPoints(code);
  gm.startRevealPhase(code);

  io.to(code).emit('phase_change', 'reveal');
  io.to(code).emit('room_update', gm.getPublicRoomState(code));
}

function advanceAfterReveal(io: Server, gm: GameManager, code: string) {
  const room = gm.getRoom(code);
  if (!room || room.phase !== 'reveal') return;

  imageProxy.clearRoom(code);
  const hasNext = gm.nextRound(code);
  const updatedRoom = gm.getRoom(code);

  if (!updatedRoom) return;

  if (updatedRoom.phase === 'finished' || !hasNext) {
    const winner = gm.getWinner(code);
    if (winner) {
      const { socketId: _, ...publicWinner } = winner;
      io.to(code).emit('game_over', { winner: publicWinner });
    } else {
      io.to(code).emit('game_over', { winner: null });
    }
    io.to(code).emit('phase_change', 'finished');
    io.to(code).emit('room_update', gm.getPublicRoomState(code));
    return;
  }

  io.to(code).emit('phase_change', 'prompt_writing');
  io.to(code).emit('room_update', gm.getPublicRoomState(code));
}
