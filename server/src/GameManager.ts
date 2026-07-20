import { v4 as uuidv4 } from 'uuid';
import {
  Player, Room, GamePhase, PromptSubmission, ImageSubmission, Vote,
  THEMES, PROMPT_TIME, GENERATING_TIME, VOTING_TIME, REVEAL_TIME,
} from './types';

const EMPTY_ROOM_TTL_MS = 60_000;

export class GameManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map();
  private roomCreatedAt: Map<string, number> = new Map();

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(): string {
    const code = this.generateRoomCode();
    this.rooms.set(code, {
      code,
      players: [],
      phase: 'waiting',
      round: 0,
      maxRounds: 5,
      currentTheme: '',
      prompts: [],
      images: [],
      votes: [],
      timerEndsAt: null,
    });
    this.roomCreatedAt.set(code, Date.now());
    this.sweepEmptyRooms();
    return code;
  }

  private sweepEmptyRooms(): void {
    const now = Date.now();
    for (const [code, createdAt] of this.roomCreatedAt) {
      const room = this.rooms.get(code);
      if (room && room.players.length === 0 && room.phase === 'waiting' && now - createdAt > EMPTY_ROOM_TTL_MS) {
        this.rooms.delete(code);
        this.roomCreatedAt.delete(code);
      }
    }
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode);
  }

  addPlayer(code: string, username: string, socketId: string): Player | null {
    if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 20) return null;

    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.players.length >= 8) return null;
    if (room.phase !== 'waiting') return null;

    const trimmedUsername = username.trim();

    const player: Player = {
      id: uuidv4(),
      username: trimmedUsername,
      socketId,
      isHost: room.players.length === 0,
      score: 0,
      streak: 0,
      hasSubmitted: false,
      hasVoted: false,
    };

    room.players.push(player);
    this.playerRooms.set(socketId, code);
    return player;
  }

  removePlayer(socketId: string): { roomCode: string | null; playerId: string | null } {
    const roomCode = this.playerRooms.get(socketId);
    const room = roomCode ? this.rooms.get(roomCode) : undefined;
    let playerId: string | null = null;

    if (room) {
      const idx = room.players.findIndex(p => p.socketId === socketId);
      if (idx !== -1) {
        playerId = room.players[idx].id;
        room.players.splice(idx, 1);
      }
      if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
        room.players[0].isHost = true;
      }
      if (room.players.length === 0) {
        this.rooms.delete(roomCode!);
        this.roomCreatedAt.delete(roomCode!);
      }
    }

    this.playerRooms.delete(socketId);
    this.sweepEmptyRooms();
    return { roomCode: roomCode ?? null, playerId };
  }

  setMaxRounds(code: string, maxRounds: number): boolean {
    const room = this.rooms.get(code);
    if (!room || room.phase !== 'waiting') return false;
    if (maxRounds < 2 || maxRounds > 5) return false;
    room.maxRounds = maxRounds;
    return true;
  }

  startGame(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room || room.players.length < 2 || room.phase !== 'waiting') return false;
    room.round = 1;
    this.startPromptPhase(room);
    return true;
  }

  private getRandomTheme(): string {
    return THEMES[Math.floor(Math.random() * THEMES.length)];
  }

  private startPromptPhase(room: Room): void {
    room.phase = 'prompt_writing';
    room.currentTheme = this.getRandomTheme();
    room.prompts = [];
    room.images = [];
    room.votes = [];
    room.timerEndsAt = Date.now() + PROMPT_TIME * 1000;

    room.players.forEach(p => {
      p.hasSubmitted = false;
      p.hasVoted = false;
    });
  }

  submitPrompt(socketId: string, prompt: string): boolean {
    const room = this.getRoomBySocket(socketId);
    if (!room || room.phase !== 'prompt_writing') {
      console.log(`[submitPrompt] FAIL: room=${!!room}, phase=${room?.phase}, socketId=${socketId}`);
      return false;
    }

    if (typeof prompt !== 'string' || prompt.trim().length < 10 || prompt.trim().length > 500) {
      return false;
    }

    const player = room.players.find(p => p.socketId === socketId);
    if (!player || player.hasSubmitted) {
      console.log(`[submitPrompt] FAIL: player=${!!player}, hasSubmitted=${player?.hasSubmitted}`);
      return false;
    }

    room.prompts.push({ playerId: player.id, prompt: prompt.trim() });
    player.hasSubmitted = true;
    console.log(`[submitPrompt] OK: player=${player.username}(${player.id}), prompts=${room.prompts.length}/${room.players.length}`);

    return true;
  }

  allPromptsSubmitted(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    return room.players.length > 0 && room.players.every(p => p.hasSubmitted);
  }

  startGeneratingPhase(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.phase = 'generating';
    room.timerEndsAt = Date.now() + GENERATING_TIME * 1000;
  }

  submitImages(code: string, images: { playerId: string; imageUrl: string }[]): boolean {
    const room = this.rooms.get(code);
    if (!room || room.phase !== 'generating') {
      console.log(`[submitImages] FAIL: room=${!!room}, phase=${room?.phase}, images=${images.length}`);
      return false;
    }

    let pushed = 0;
    for (const img of images) {
      if (room.images.some(i => i.playerId === img.playerId)) continue;
      const prompt = room.prompts.find(p => p.playerId === img.playerId);
      if (!prompt) {
        console.log(`[submitImages] SKIP: playerId=${img.playerId} not found in prompts`);
        continue;
      }
      room.images.push({ playerId: img.playerId, imageUrl: img.imageUrl, prompt: prompt.prompt });
      pushed++;
    }
    console.log(`[submitImages] OK: pushed=${pushed}/${images.length}, totalImages=${room.images.length}`);
    return true;
  }

  allImagesSubmitted(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    return room.players.length > 0 && room.players.every(p => room.images.some(i => i.playerId === p.id));
  }

  startVotingPhase(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.phase = 'voting';
    room.timerEndsAt = Date.now() + VOTING_TIME * 1000;
  }

  submitVote(socketId: string, targetId: string): boolean {
    const room = this.getRoomBySocket(socketId);
    if (!room || room.phase !== 'voting') return false;

    const voter = room.players.find(p => p.socketId === socketId);
    if (!voter || voter.hasVoted) return false;
    if (voter.id === targetId) return false;

    const target = room.players.find(p => p.id === targetId);
    if (!target) return false;

    room.votes.push({ voterId: voter.id, targetId });
    voter.hasVoted = true;
    return true;
  }

  allVotesSubmitted(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    return room.players.length > 0 && room.players.every(p => p.hasVoted);
  }

  getVoteResults(code: string): { playerId: string; votes: number }[] {
    const room = this.rooms.get(code);
    if (!room) return [];

    return room.players.map(p => ({
      playerId: p.id,
      votes: room.votes.filter(v => v.targetId === p.id).length,
    }));
  }

  awardPoints(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    const results = this.getVoteResults(code);
    results.forEach(r => {
      const player = room.players.find(p => p.id === r.playerId);
      if (player) {
        player.score += r.votes;
        if (r.votes > 0) {
          player.streak += 1;
        } else {
          player.streak = 0;
        }
      }
    });
  }

  startRevealPhase(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.phase = 'reveal';
    room.timerEndsAt = Date.now() + REVEAL_TIME * 1000;
  }

  nextRound(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;

    room.round += 1;
    if (room.round > room.maxRounds) {
      room.phase = 'finished';
      room.timerEndsAt = null;
      return false;
    }

    this.startPromptPhase(room);
    return true;
  }

  getWinner(code: string): Player | null {
    const room = this.rooms.get(code);
    if (!room || room.players.length === 0) return null;

    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    if (sorted[0].score === 0 && sorted.every(p => p.score === 0)) return null;
    return sorted[0] || null;
  }

  getPublicRoomState(code: string) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const state = {
      code: room.code,
      phase: room.phase,
      round: room.round,
      maxRounds: room.maxRounds,
      currentTheme: room.currentTheme,
      players: room.players.map(p => ({
        id: p.id,
        username: p.username,
        isHost: p.isHost,
        score: p.score,
        streak: p.streak,
        hasSubmitted: p.hasSubmitted,
        hasVoted: p.hasVoted,
      })),
      images: room.phase === 'generating' || room.phase === 'voting' || room.phase === 'reveal' || room.phase === 'finished'
        ? room.images.map(i => ({ ...i }))
        : [],
      votes: room.phase === 'reveal' || room.phase === 'finished'
        ? room.votes
        : [],
      voteResults: room.phase === 'reveal' || room.phase === 'finished'
        ? this.getVoteResults(code)
        : [],
      timerEndsAt: room.timerEndsAt,
      timerMax: room.phase === 'generating' ? GENERATING_TIME
        : room.phase === 'reveal' ? REVEAL_TIME
        : room.phase === 'prompt_writing' ? PROMPT_TIME
        : room.phase === 'voting' ? VOTING_TIME
        : 0,
    };

    if (room.phase === 'voting' || room.phase === 'reveal') {
      console.log(`[getPublicRoomState] phase=${room.phase}, images=${state.images.length}, room.images=${room.images.length}`);
    }

    return state;
  }
}
