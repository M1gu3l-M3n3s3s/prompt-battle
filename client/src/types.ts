export type GamePhase =
  | 'waiting'
  | 'prompt_writing'
  | 'generating'
  | 'voting'
  | 'reveal'
  | 'finished';

export interface Player {
  id: string;
  username: string;
  isHost: boolean;
  score: number;
  streak: number;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

export interface ImageData {
  playerId: string;
  imageUrl: string;
  prompt: string;
}

export interface VoteData {
  voterId: string;
  targetId: string;
}

export interface VoteResult {
  playerId: string;
  votes: number;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  currentTheme: string;
  players: Player[];
  images: ImageData[];
  votes: VoteData[];
  voteResults: VoteResult[];
  timerEndsAt: number | null;
}

export interface GameOverData {
  winner: Player | null;
}
