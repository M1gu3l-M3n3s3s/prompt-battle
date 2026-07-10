import { useState, useEffect } from 'react';

export function useTimer(targetTimestamp: number | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!targetTimestamp) { setRemaining(0); return; }

    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return remaining;
}
