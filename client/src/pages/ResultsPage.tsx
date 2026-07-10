import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import type { AppState } from '../App';

interface Props {
  appState: AppState;
  onNavigate: (view: AppState['view'], extra?: Partial<AppState>) => void;
}

export default function ResultsPage({ appState, onNavigate }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const { room, winner } = state;

  const currentPlayer = room?.players.find(p => p.id === appState.playerId);
  const sortedPlayers = [...(room?.players || [])].sort((a, b) => b.score - a.score);

  const isWinner = winner?.id === appState.playerId;

  const handlePlayAgain = () => {
    socket?.emit('leave_room');
    onNavigate('home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-bounce-in">
        <div className="text-center mb-10">
          <p className="text-6xl mb-4">{isWinner ? '🏆' : '🎮'}</p>
          <h1 className="font-display text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 mb-4">
            {isWinner ? '¡Eres el Ganador!' : 'Fin del Juego'}
          </h1>
          {winner && (
            <p className="text-xl text-gray-300">
              Ganador: <span className="font-bold text-primary-400">{winner.username}</span>
            </p>
          )}
          {winner && winner.score !== undefined && (
            <p className="text-gray-500 mt-2">{winner.score} puntos</p>
          )}
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-lg">Clasificación Final</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 ${
                  player.id === appState.playerId ? 'bg-primary-500/10' : ''
                } ${player.eliminated ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${idx === 0 ? 'text-primary-400' : idx === 1 ? 'text-secondary-400' : idx === 2 ? 'text-accent-400' : 'text-gray-600'}`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-medium">{player.username}</p>
                    {player.eliminated && <p className="text-xs text-red-400">Eliminado</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{player.score}</p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={handlePlayAgain}
            className="px-10 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-secondary-500 transition-all duration-300"
          >
            Jugar de Nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
