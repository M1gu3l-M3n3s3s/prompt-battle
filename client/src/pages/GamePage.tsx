import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import type { AppState } from '../App';
import Timer from '../components/Timer';
import ThemeDisplay from '../components/ThemeDisplay';
import PromptInput from '../components/PromptInput';
import VotingGallery from '../components/VotingGallery';
import Leaderboard from '../components/Leaderboard';
import { getPhaseLabel, getPhaseColor } from '../utils/api';

interface Props {
  appState: AppState;
  onNavigate: (view: AppState['view'], extra?: Partial<AppState>) => void;
}

export default function GamePage({ appState, onNavigate }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const { room, phase, timer, eliminatedPlayerId } = state;
  const [imagesReady, setImagesReady] = useState<Set<number>>(new Set());

  React.useEffect(() => {
    setImagesReady(new Set());
  }, [room?.round]);

  const handleAdvance = () => {
    socket?.emit('advance_reveal');
  };

  const currentPlayer = room?.players.find(p => p.id === appState.playerId);

  React.useEffect(() => {
    if (phase === 'finished') {
      onNavigate('results', { roomCode: appState.roomCode, username: appState.username, playerId: appState.playerId });
    }
  }, [phase, appState.roomCode, appState.username, appState.playerId, onNavigate]);

  React.useEffect(() => {
    if (phase !== 'generating' || !room?.images.length) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    room.images.forEach((img, idx) => {
      const t = setTimeout(() => {
        const preload = new Image();
        preload.onload = () => setImagesReady(prev => new Set(prev).add(idx));
        preload.src = img.imageUrl;
      }, idx * 5000);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [phase, room?.images.length]);

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
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in gap-8">
              <ThemeDisplay theme={room.currentTheme} />
              <div className="text-center">
                <div className="w-24 h-24 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-purple-400 mb-2">Generando imágenes...</h3>
                <p className="text-gray-500 mb-4">La IA está creando arte a partir de vuestros prompts</p>
                <p className="text-gray-600 text-sm">Espera mientras se generan todas las imágenes — <span className="text-primary-400 font-bold">{timer}s</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                {room.players.filter(p => !p.eliminated).map(p => {
                  const imgIdx = room.images.findIndex(i => i.playerId === p.id);
                  const isLoaded = imgIdx !== -1 && imagesReady.has(imgIdx);
                  return (
                    <div key={p.id} className="bg-gray-900/60 rounded-xl p-4 text-center border border-gray-800">
                      <p className="text-gray-400 text-sm truncate">"{room.images.find(i => i.playerId === p.id)?.prompt || p.username}"</p>
                      {isLoaded ? (
                        <span className="text-green-500 text-xs mt-2 block">✓ Lista</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-purple-400 text-xs">Descargando...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(phase === 'voting' || phase === 'reveal') && (
            <div className="animate-fade-in space-y-6">
              <ThemeDisplay theme={room.currentTheme} />
              <VotingGallery
                images={room.images}
                votes={room.votes}
                playerId={appState.playerId}
                phase={phase}
                voteResults={room.voteResults}
                eliminatedPlayerId={eliminatedPlayerId}
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

      {eliminatedPlayerId && phase === 'reveal' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
             onClick={handleAdvance}>
          <div className="bg-gray-900 rounded-2xl p-8 text-center border border-red-500/30 animate-bounce-in max-w-sm"
               onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-4">💀</p>
            <h3 className="text-2xl font-bold text-red-400 mb-2">Eliminado</h3>
            <p className="text-gray-400 mb-6">
              {room.players.find(p => p.id === eliminatedPlayerId)?.username || 'Alguien'} ha sido eliminado
            </p>
            <button
              onClick={handleAdvance}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-secondary-500 transition-all duration-300"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
