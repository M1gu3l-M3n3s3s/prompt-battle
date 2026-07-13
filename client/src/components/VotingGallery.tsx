import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import type { ImageData, VoteData, VoteResult, GamePhase } from '../types';

interface Props {
  images: ImageData[];
  votes: VoteData[];
  playerId: string;
  phase: GamePhase;
  voteResults: VoteResult[];
  eliminatedPlayerId: string | null;
}

function ImageWithRetry({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState('');
  const retries = useRef(0);
  const mounted = useRef(true);

  const loadImage = useCallback(() => {
    if (retries.current >= 5) {
      if (!mounted.current) return;
      setState('error');
      return;
    }
    retries.current += 1;
    const img = new Image();
    img.onload = () => {
      if (!mounted.current) return;
      setCurrentSrc(src);
      setState('loaded');
    };
    img.onerror = () => {
      if (!mounted.current) return;
      const delay = Math.min(2000 * retries.current, 15000);
      setTimeout(loadImage, delay);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    mounted.current = true;
    loadImage();
    return () => { mounted.current = false; };
  }, [loadImage]);

  if (state === 'loaded') {
    return <img src={currentSrc} alt={alt} className="w-full h-48 md:h-56 object-cover" />;
  }

  if (state === 'error') {
    return (
      <div className="w-full h-48 md:h-56 bg-gray-800 flex flex-col items-center justify-center">
        <p className="text-gray-500 text-xs">Imagen no disponible</p>
      </div>
    );
  }

  return (
    <div className="w-full h-48 md:h-56 bg-gray-800 flex flex-col items-center justify-center animate-pulse">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="text-gray-400 text-xs font-medium">Generando imagen...</p>
      <p className="text-gray-600 text-[10px] mt-1">Intento #{retries.current}</p>
    </div>
  );
}

export default function VotingGallery({ images, votes, playerId, phase, voteResults, eliminatedPlayerId }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);

  const currentPlayer = state.room?.players.find(p => p.id === playerId);
  const isEliminated = currentPlayer?.eliminated;
  const hasVoted = currentPlayer?.hasVoted || votedFor !== null;

  const handleVote = (targetId: string) => {
    if (!socket || hasVoted || isEliminated || phase !== 'voting') return;
    if (targetId === playerId) return;

    const previousVote = votedFor;
    setVotedFor(targetId);

    socket.emit('submit_vote', { targetId }, (res: { success: boolean; error?: string }) => {
      if (res.success) {
        setVotedId(targetId);
      } else {
        setVotedFor(previousVote);
      }
    });
  };

  const getVoteCount = (targetId: string): number => {
    return voteResults.find(r => r.playerId === targetId)?.votes || 0;
  };

  const isRevealPhase = phase === 'reveal' || phase === 'finished';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((img, idx) => {
          const player = state.room?.players.find(p => img.playerId && p.id === img.playerId);
          const isOwn = img.playerId === playerId;
          const isEliminatedPlayer = eliminatedPlayerId && img.playerId === eliminatedPlayerId;
          const isVotedByMe = votedId === img.playerId;
          const voteCount = img.playerId ? getVoteCount(img.playerId) : 0;
          const maxVotes = isRevealPhase ? Math.max(...voteResults.map(r => r.votes), 0) : 0;

          return (
            <div
              key={idx}
              className={`relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 ${
                isRevealPhase && isEliminatedPlayer ? 'border-red-500/50 ring-2 ring-red-500/20' :
                isRevealPhase && voteCount === maxVotes && maxVotes > 0 && !isEliminatedPlayer ? 'border-green-500/50 ring-2 ring-green-500/20' :
                isVotedByMe ? 'border-primary-500' :
                'border-gray-800 hover:border-gray-700'
              } ${!hasVoted && !isOwn && phase === 'voting' && !isEliminated ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
              onClick={() => !isOwn && handleVote(img.playerId || '')}
            >
              <ImageWithRetry src={img.imageUrl} alt={img.prompt} />

              {isRevealPhase && img.playerId && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80">
                  <span className={`text-sm font-medium ${isEliminatedPlayer ? 'text-red-400' : 'text-gray-200'}`}>
                    {player?.username || 'Desconocido'}
                  </span>
                  {isOwn && !isRevealPhase && <span className="text-xs text-primary-400">(tu imagen)</span>}
                  <span className="ml-auto text-sm text-gray-500">{voteCount} votos</span>
                </div>
              )}

              {!isRevealPhase && !img.playerId && (
                <div className="px-4 py-3 bg-gray-800/80">
                  <p className="text-xs text-gray-500">Imagen anónima</p>
                </div>
              )}

              {!isRevealPhase && isOwn && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-primary-600/80 rounded-lg text-xs font-bold">
                  TU PROMPT
                </div>
              )}

              {phase === 'voting' && !isOwn && !hasVoted && !isEliminated && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center transition-all duration-300 group">
                  <span className="opacity-0 group-hover:opacity-100 bg-primary-600 px-4 py-2 rounded-lg font-bold text-sm transition-opacity">
                    Votar
                  </span>
                </div>
              )}

              {isVotedByMe && (
                <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 rounded-lg text-xs font-bold animate-bounce-in">
                  ✓ VOTADO
                </div>
              )}

              {isRevealPhase && isEliminatedPlayer && (
                <div className="absolute top-2 left-2 px-3 py-1 bg-red-500/80 rounded-lg text-xs font-bold">
                  💀 ELIMINADO
                </div>
              )}

              {isRevealPhase && voteCount === maxVotes && maxVotes > 0 && !isEliminatedPlayer && (
                <div className="absolute top-2 left-2 px-3 py-1 bg-green-500/80 rounded-lg text-xs font-bold animate-bounce-in">
                  🏆 GANADOR
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasVoted && phase === 'voting' && (
        <div className="text-center animate-fade-in">
          <p className="text-green-400 font-medium">Voto registrado. Esperando a los demás jugadores...</p>
        </div>
      )}

      {isEliminated && phase === 'voting' && (
        <div className="text-center animate-fade-in">
          <p className="text-gray-500">Estás eliminado. Tus votos no cuentan en esta ronda.</p>
        </div>
      )}
    </div>
  );
}
