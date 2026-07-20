import type { Player, GamePhase } from '../types';

interface Props {
  players: Player[];
  currentPlayerId: string;
  phase?: GamePhase;
}

export default function PlayerList({ players, currentPlayerId, phase }: Props) {
  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-bold">Jugadores</h3>
        <span className="text-sm text-gray-500">{players.length}/8</span>
      </div>
      <div className="p-2 space-y-1">
        {players.map((player, idx) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              player.id === currentPlayerId ? 'bg-primary-500/10 border border-primary-500/30' : 'hover:bg-gray-800/50'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              player.isHost ? 'bg-primary-600' : 'bg-gray-700'
            }`}>
              {player.isHost ? '👑' : `#${idx + 1}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {player.username}
                {player.id === currentPlayerId && <span className="text-xs text-primary-400 ml-1">(tú)</span>}
              </p>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>{player.score} pts</span>
                {player.streak > 0 && <span className="text-accent-400">🔥 {player.streak}</span>}
              </div>
            </div>
            {phase === 'prompt_writing' && player.hasSubmitted && <span className="text-green-400 text-sm">✓</span>}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-gray-600 text-center py-8">Esperando jugadores...</p>
        )}
      </div>
    </div>
  );
}
