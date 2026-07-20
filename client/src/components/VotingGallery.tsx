import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import ImageWithRetry from './ImageWithRetry';
import type { ImageData, VoteData, VoteResult, GamePhase } from '../types';

interface Props {
  images: ImageData[];
  votes: VoteData[];
  playerId: string;
  phase: GamePhase;
  voteResults: VoteResult[];
}

export default function VotingGallery({ images, votes, playerId, phase, voteResults }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);

  const currentPlayer = state.room?.players.find(p => p.id === playerId);
  const hasVoted = currentPlayer?.hasVoted || votedFor !== null;

  const handleVote = (targetId: string) => {
    if (!socket || hasVoted || phase !== 'voting') return;
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
  const maxVotes = isRevealPhase ? Math.max(...voteResults.map(r => r.votes), 0) : 0;
  const winnersCount = isRevealPhase ? voteResults.filter(r => r.votes === maxVotes && maxVotes > 0).length : 0;

  return (
    <div className="space-y-4">
      {phase === 'voting' && !hasVoted && (
        <div className="bg-gradient-to-r from-primary-900/40 to-secondary-900/40 border border-primary-500/30 rounded-xl px-6 py-3 text-center animate-fade-in">
          <p className="text-primary-300 font-medium">
            Vota por tu imagen favorita de esta ronda
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((img, idx) => {
          const player = state.room?.players.find(p => img.playerId && p.id === img.playerId);
          const isOwn = img.playerId === playerId;
          const isVotedByMe = votedId === img.playerId;
          const voteCount = img.playerId ? getVoteCount(img.playerId) : 0;

          return (
            <div
              key={idx}
              className={`relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 ${
                isRevealPhase && voteCount === maxVotes && maxVotes > 0 ? 'border-green-500/50 ring-2 ring-green-500/20' :
                isVotedByMe ? 'border-primary-500' :
                'border-gray-800 hover:border-gray-700'
              } ${!hasVoted && !isOwn && phase === 'voting' ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
              onClick={() => img.playerId && !isOwn && handleVote(img.playerId)}
            >
              <ImageWithRetry src={img.imageUrl} alt={img.prompt} />

              {isRevealPhase && img.playerId && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80">
                  <span className="text-sm font-medium text-gray-200">
                    {player?.username || 'Desconocido'}
                  </span>
                  {isOwn && <span className="text-xs text-primary-400">(tu imagen)</span>}
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

              {phase === 'voting' && !isOwn && !hasVoted && (
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

              {isRevealPhase && voteCount === maxVotes && maxVotes > 0 && (
                <div className="absolute top-2 left-2 px-3 py-1 bg-green-500/80 rounded-lg text-xs font-bold animate-bounce-in">
                  {winnersCount > 1 ? '🤝 EMPATE' : '🏆 GANADOR'}
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
    </div>
  );
}
