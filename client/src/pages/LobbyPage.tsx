import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import type { AppState } from '../App';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';

interface Props {
  appState: AppState;
  onNavigate: (view: AppState['view'], extra?: Partial<AppState>) => void;
}

export default function LobbyPage({ appState, onNavigate }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const [error, setError] = useState('');

  const currentPlayer = state.room?.players.find(p => p.id === appState.playerId);
  const isHost = currentPlayer?.isHost ?? false;

  useEffect(() => {
    if (!socket) return;

    const handlePhaseChange = (phase: string) => {
      if (phase === 'prompt_writing') {
        onNavigate('game', { roomCode: appState.roomCode, username: appState.username, playerId: currentPlayer?.id || '' });
      }
    };

    socket.on('phase_change', handlePhaseChange);
    return () => { socket.off('phase_change', handlePhaseChange); };
  }, [socket, appState.roomCode, appState.username, currentPlayer?.id]);

  const handleStart = () => {
    if (!socket) return;
    setError('');
    socket.emit('start_game', { code: appState.roomCode }, (res: { success: boolean; error?: string }) => {
      if (!res.success) setError(res.error || 'Error');
    });
  };

  const handleLeave = () => {
    socket?.emit('leave_room');
    onNavigate('home');
  };

  const players = state.room?.players || [];

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="font-display text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
          Prompt Battle Royale
        </h1>
        <p className="text-gray-500 mt-2">Sala: <span className="text-primary-400 font-bold tracking-widest">{appState.roomCode}</span></p>
        <button
          onClick={() => { navigator.clipboard?.writeText(appState.roomCode); }}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          (copiar código)
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto w-full">
        <div className="flex-1">
          <PlayerList players={players} currentPlayerId={appState.playerId} />
        </div>
        <div className="w-full lg:w-80">
          <Chat roomCode={appState.roomCode} />
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={handleLeave}
          className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl font-medium hover:bg-gray-700 transition-colors"
        >
          Salir
        </button>
        {isHost && players.length >= 2 && (
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-secondary-500 transition-all duration-300 animate-pulse-glow"
          >
            Iniciar Juego
          </button>
        )}
        {isHost && players.length < 2 && (
          <p className="text-gray-500 self-center">Esperando más jugadores (mín 2)...</p>
        )}
      </div>

      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
    </div>
  );
}
