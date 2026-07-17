import React from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import type { AppState } from '../App';
import Timer from '../components/Timer';
import ThemeDisplay from '../components/ThemeDisplay';
import PromptInput from '../components/PromptInput';
import VotingGallery from '../components/VotingGallery';
import ImageWithRetry from '../components/ImageWithRetry';
import Leaderboard from '../components/Leaderboard';
import { getPhaseLabel, getPhaseColor } from '../utils/api';

interface Props {
  appState: AppState;
  onNavigate: (view: AppState['view'], extra?: Partial<AppState>) => void;
}

export default function GamePage({ appState, onNavigate }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const { room, phase, timer } = state;

  const handleAdvance = () => {
    socket?.emit('advance_reveal');
  };

  const currentPlayer = room?.players.find(p => p.id === appState.playerId);

  React.useEffect(() => {
    if (phase === 'finished') {
      onNavigate('results', { roomCode: appState.roomCode, username: appState.username, playerId: appState.playerId });
    }
  }, [phase, appState.roomCode, appState.username, appState.playerId, onNavigate]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Cargando sala...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="font-display text-sm text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
            Ronda {room.round}/{room.maxRounds}
          </h2>
          <p className={`text-lg font-bold ${getPhaseColor(phase)}`}>
            {getPhaseLabel(phase)}
          </p>
        </div>
        <Timer seconds={timer} max={phase === 'generating' ? 60 : phase === 'reveal' ? 10 : 30} />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{appState.username}</span>
          <span className="text-xs text-gray-600">Sala: {room.code}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-6">
          {phase === 'prompt_writing' && (
            <div className="animate-fade-in space-y-6">
              <ThemeDisplay theme={room.currentTheme} />
              <PromptInput key={room.round} playerId={appState.playerId} />
            </div>
          )}

          {(phase === 'generating') && (
            <div className="flex-1 flex flex-col items-center animate-fade-in gap-8">
              <ThemeDisplay theme={room.currentTheme} />
              <div className="text-center">
                <div className="w-24 h-24 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-purple-400 mb-2">Generando imágenes...</h3>
                <p className="text-gray-500 mb-4">La IA está creando arte a partir de vuestros prompts</p>
                <p className="text-gray-600 text-sm">Espera mientras se generan todas las imágenes — <span className="text-primary-400 font-bold">{timer}s</span></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                {room.players.map(p => {
                  const imgData = room.images.find(i => i.playerId === p.id);
                  return (
                    <div key={p.id} className="bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800">
                      {imgData ? (
                        <ImageWithRetry src={imgData.imageUrl} alt={imgData.prompt} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-gray-400 text-xs truncate">{imgData?.prompt || 'Esperando prompt...'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(phase === 'voting' || phase === 'reveal') && (
            <div className="animate-fade-in space-y-6">
              <ThemeDisplay theme={room.currentTheme} />
              <VotingGallery key={room.round}
                images={room.images}
                votes={room.votes}
                playerId={appState.playerId}
                phase={phase}
                voteResults={room.voteResults}
              />
            </div>
          )}

          {phase === 'finished' && (
            <div className="animate-fade-in space-y-6">
              <ThemeDisplay theme={room.currentTheme} />
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 shrink-0">
          <Leaderboard players={room.players} currentPlayerId={appState.playerId} />
        </div>
      </div>

      {phase === 'reveal' && currentPlayer?.isHost && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleAdvance}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-secondary-500 transition-all duration-300 animate-pulse-glow"
          >
            Siguiente Ronda
          </button>
        </div>
      )}
    </div>
  );
}
