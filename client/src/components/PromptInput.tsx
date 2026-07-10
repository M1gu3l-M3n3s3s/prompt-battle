import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';

interface Props {
  playerId: string;
}

export default function PromptInput({ playerId }: Props) {
  const { socket } = useSocket();
  const { state } = useGame();
  const [prompt, setPrompt] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const currentPlayer = state.room?.players.find(p => p.id === playerId);
  const isEliminated = currentPlayer?.eliminated;

  const handleSubmit = () => {
    if (!socket || !prompt.trim() || submitted || isEliminated) return;
    if (prompt.trim().length < 10) { setError('Mínimo 10 caracteres'); return; }
    if (prompt.trim().length > 500) { setError('Máximo 500 caracteres'); return; }

    setError('');
    socket.emit('submit_prompt', { prompt: prompt.trim() }, (res: { success: boolean }) => {
      if (res.success) {
        setSubmitted(true);
      }
    });
  };

  if (isEliminated) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6 text-center">
        <p className="text-red-400">Has sido eliminado. Espera a la próxima ronda.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-gradient-to-r from-primary-900/30 to-secondary-900/30 border border-primary-500/30 rounded-2xl p-8 text-center animate-bounce-in">
        <p className="text-4xl mb-3">✓</p>
        <h3 className="text-xl font-bold text-green-400 mb-2">Prompt Enviado</h3>
        <p className="text-gray-500">Espera a que todos terminen para ver los resultados</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 animate-slide-up">
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Escribe tu prompt para generar la imagen
        </label>
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setError(''); }}
          placeholder="Describe la imagen que quieres generar... Sé creativo!"
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">{prompt.length}/500</span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || prompt.trim().length < 10}
        className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-secondary-500 disabled:opacity-40 transition-all duration-300"
      >
        Enviar Prompt
      </button>
    </div>
  );
}
