import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { RoomState, GamePhase } from '../types';

interface GameState {
  room: RoomState | null;
  playerId: string | null;
  username: string | null;
  phase: GamePhase;
  timer: number;
  eliminatedPlayerId: string | null;
  winner: { id: string; username: string; score?: number } | null;
}

type GameAction =
  | { type: 'SET_ROOM'; room: RoomState }
  | { type: 'SET_PLAYER'; playerId: string; username: string }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'TIMER_TICK'; time: number }
  | { type: 'PLAYER_ELIMINATED'; playerId: string }
  | { type: 'GAME_OVER'; winner: { id: string; username: string; score?: number } | null }
  | { type: 'RESET' };

const initialState: GameState = {
  room: null,
  playerId: null,
  username: null,
  phase: 'waiting',
  timer: 0,
  eliminatedPlayerId: null,
  winner: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.room, phase: action.room.phase };
    case 'SET_PLAYER':
      return { ...state, playerId: action.playerId, username: action.username };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'TIMER_TICK':
      return { ...state, timer: action.time };
    case 'PLAYER_ELIMINATED':
      return { ...state, eliminatedPlayerId: action.playerId };
    case 'GAME_OVER':
      return { ...state, winner: action.winner, phase: 'finished' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_update', (room: RoomState) => dispatch({ type: 'SET_ROOM', room }));
    socket.on('phase_change', (phase: GamePhase) => dispatch({ type: 'SET_PHASE', phase }));
    socket.on('timer_tick', (time: number) => dispatch({ type: 'TIMER_TICK', time }));
    socket.on('player_eliminated', (playerId: string) => dispatch({ type: 'PLAYER_ELIMINATED', playerId }));
    socket.on('game_over', (data: { winner: { id: string; username: string } | null }) => dispatch({ type: 'GAME_OVER', winner: data.winner }));
    socket.on('images_ready', () => {});

    return () => {
      socket.off('room_update');
      socket.off('phase_change');
      socket.off('timer_tick');
      socket.off('player_eliminated');
      socket.off('game_over');
      socket.off('images_ready');
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
