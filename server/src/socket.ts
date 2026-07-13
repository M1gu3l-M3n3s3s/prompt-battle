import { Server, Socket } from 'socket.io';
import { GameManager } from './GameManager';

export function setupSocket(io: Server): GameManager {
  const gameManager = new GameManager();
  const activeTimers = new Set<string>();

  io.on('connection', (socket: Socket) => {
    console.log(`[+] ${socket.id} connected`);

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
        return callback({ success: false, error: 'Error al unirse' });
      }

      socket.join(code);
      callback({ success: true, playerId: player.id });
      io.to(code).emit('room_update', gameManager.getPublicRoomState(code));
    });

    socket.on('start_game', (_data: unknown, callback: (res: { success: boolean; error?: string }) => void) => {
      const room = gameManager.getRoomBySocket(socket.id);
      if (!room) return callback({ success: false, error: 'No estás en una sala' });
      const success = gameManager.startGame(room.code);
      if (!success) return callback({ success: false, error: 'No se puede iniciar (mín 2 jugadores)' });
      callback({ success: true });
      io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
      io.to(room.code).emit('phase_change', 'prompt_writing');
      startTimerLoop(io, gameManager, room.code, activeTimers);
    });

      socket.on('submit_prompt', (data: { prompt: string }, callback: (res: { success: boolean }) => void) => {
        const success = gameManager.submitPrompt(socket.id, data.prompt);
        console.log(`[submit_prompt handler] success=${success}, socketId=${socket.id}`);
        callback({ success });

        const room = gameManager.getRoomBySocket(socket.id);
        if (room) {
          const allSubmitted = gameManager.allPromptsSubmitted(room.code);
          console.log(`[submit_prompt handler] allSubmitted=${allSubmitted}, room=${room.code}, phase=${room.phase}`);
          io.to(room.code).emit('room_update', gameManager.getPublicRoomState(room.code));
          if (allSubmitted) {
            console.log(`[submit_prompt handler] ALL SUBMITTED -> starting generation`);
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
      advanceAfterReveal(io, gameManager, room.code);
    });

    socket.on('chat_message', (data: { roomCode: string; text: string }) => {
      const room = gameManager.getRoom(data.roomCode);
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;
      if (typeof data.text !== 'string' || data.text.trim().length === 0 || data.text.length > 200) return;
      const msg = { id: `${Date.now()}-${socket.id}`, username: player.username, text: data.text.trim(), timestamp: Date.now() };
      io.to(data.roomCode).emit('chat_message', msg);
    });

    socket.on('leave_room', () => {
      const { roomCode, playerId } = gameManager.removePlayer(socket.id);
      if (roomCode) {
        socket.leave(roomCode);
        io.to(roomCode).emit('room_update', gameManager.getPublicRoomState(roomCode));
      }
    });

    socket.on('disconnect', () => {
      console.log(`[-] ${socket.id} disconnected`);
      const { roomCode } = gameManager.removePlayer(socket.id);
      if (roomCode) {
        socket.leave(roomCode);
        io.to(roomCode).emit('room_update', gameManager.getPublicRoomState(roomCode));
      }
    });
  });

  return gameManager;
}

function startTimerLoop(io: Server, gm: GameManager, code: string, activeTimers: Set<string>) {
  if (activeTimers.has(code)) return;
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
  if (!room) {
    console.log(`[handlePhaseTimeout] room not found`);
    return;
  }

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

function generateImages(io: Server, gm: GameManager, code: string) {
  const room = gm.getRoom(code);
  if (!room) {
    console.log(`[generateImages] FAIL: room not found for code=${code}`);
    return;
  }

  console.log(`[generateImages] START: prompts=${room.prompts.length}, phase=${room.phase}`);
  
  const imageEntries = room.prompts.map(p => ({
    playerId: p.playerId,
    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(p.prompt)}?width=400&height=400&seed=${p.playerId}&nologo=true`,
  }));
  
  console.log(`[generateImages] Entries to submit: ${JSON.stringify(imageEntries.map(e => ({ playerId: e.playerId, url: e.imageUrl.substring(0, 60) + '...' })))}`);
  
  gm.submitImages(code, imageEntries);
  io.to(code).emit('room_update', gm.getPublicRoomState(code));
}

function endVotingPhase(io: Server, gm: GameManager, code: string) {
  gm.awardPoints(code);
  const eliminatedId = gm.processElimination(code);
  gm.startRevealPhase(code);

  io.to(code).emit('phase_change', 'reveal');
  io.to(code).emit('player_eliminated', eliminatedId);
  io.to(code).emit('room_update', gm.getPublicRoomState(code));
}

function advanceAfterReveal(io: Server, gm: GameManager, code: string) {
  const hasNext = gm.nextRound(code);
  const room = gm.getRoom(code);

  if (!room) return;

  if (room.phase === 'finished' || !hasNext) {
    const winner = gm.getWinner(code);
    io.to(code).emit('game_over', { winner });
    io.to(code).emit('phase_change', 'finished');
    io.to(code).emit('room_update', gm.getPublicRoomState(code));
    return;
  }

  io.to(code).emit('phase_change', 'prompt_writing');
  io.to(code).emit('room_update', gm.getPublicRoomState(code));
}
