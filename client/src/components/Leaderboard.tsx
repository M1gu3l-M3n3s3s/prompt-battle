import type { Player } from '../types';

interface Props {
  players: Player[];
  currentPlayerId: string;
}

export default function Leaderboard({ players, currentPlayerId }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-bold">Clasificación</h3>
      </div>
      <div className="divide-y divide-gray-800/50">
        {sorted.map((player, idx) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 ${
              player.id === currentPlayerId ? 'bg-primary-500/10' : ''
            }`}
          >
            <span className={`w-6 text-center font-bold text-sm ${
              idx === 0 ? 'text-primary-400' : idx === 1 ? 'text-secondary-400' : idx === 2 ? 'text-accent-400' : 'text-gray-600'
            }`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {player.username}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{player.score}</p>
              {player.streak > 1 && <p className="text-xs text-accent-400">🔥{player.streak}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
