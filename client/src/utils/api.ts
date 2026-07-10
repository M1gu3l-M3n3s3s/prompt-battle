export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    waiting: 'Esperando jugadores',
    prompt_writing: 'Escribe tu prompt',
    generating: 'Generando imágenes',
    voting: 'Votación',
    reveal: 'Resultados',
    finished: 'Fin del juego',
  };
  return labels[phase] || phase;
}

export function getPhaseColor(phase: string): string {
  const colors: Record<string, string> = {
    waiting: 'text-yellow-400',
    prompt_writing: 'text-blue-400',
    generating: 'text-purple-400',
    voting: 'text-green-400',
    reveal: 'text-orange-400',
    finished: 'text-pink-400',
  };
  return colors[phase] || 'text-white';
}
