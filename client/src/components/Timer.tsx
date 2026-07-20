import { formatTimer } from '../utils/api';

interface Props {
  seconds: number;
  max?: number;
}

export default function Timer({ seconds, max = 60 }: Props) {
  const isLow = seconds <= 10;
  const isCritical = seconds <= 5;
  const circumference = 2 * Math.PI * 28;
  const progress = max > 0 ? Math.min(seconds / max, 1) : 0;

  return (
    <div className={`flex items-center gap-3 ${isCritical ? 'animate-shake' : ''}`}>
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-800" />
          <circle
            cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
            strokeDasharray={`${progress * circumference} ${circumference}`}
            strokeDashoffset="0"
            className={`${isCritical ? 'text-red-500' : isLow ? 'text-yellow-400' : 'text-primary-400'} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-display text-sm ${
          isCritical ? 'text-red-500' : isLow ? 'text-yellow-400' : 'text-primary-400'
        }`}>
          {seconds}
        </span>
      </div>
      <span className={`font-mono text-2xl font-bold tabular-nums ${
        isCritical ? 'text-red-500' : isLow ? 'text-yellow-400' : 'text-primary-400'
      }`}>
        {formatTimer(seconds)}
      </span>
    </div>
  );
}
