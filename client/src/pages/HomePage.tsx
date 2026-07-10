import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import type { AppState } from '../App';

interface Props {
  onNavigate: (view: AppState['view'], extra?: Partial<AppState>) => void;
}

export default function HomePage({ onNavigate }: Props) {
  const { socket } = useSocket();
  const { dispatch } = useGame();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const isValid = username.trim().length >= 2 && username.trim().length <= 20;

  const handleCreate = () => {
    if (!isValid || !socket) return;
    setLoading(true);
    setError('');
    socket.emit('create_room', (res: { code: string }) => {
      socket.emit('join_room', { code: res.code, username: username.trim() }, (joinRes: { success: boolean; playerId?: string; error?: string }) => {
        setLoading(false);
        if (!joinRes.success) { setError(joinRes.error || 'Error'); return; }
        dispatch({ type: 'SET_PLAYER', playerId: joinRes.playerId || '', username: username.trim() });
        onNavigate('lobby', { roomCode: res.code, username: username.trim(), playerId: joinRes.playerId || '' });
      });
    });
  };

  const handleJoin = () => {
    if (!isValid || !socket || !roomCode.trim()) return;
    setLoading(true);
    setError('');
    socket.emit('join_room', { code: roomCode.trim().toUpperCase(), username: username.trim() }, (res: { success: boolean; playerId?: string; error?: string }) => {
      setLoading(false);
      if (!res.success) { setError(res.error || 'Error al unirse'); return; }
      dispatch({ type: 'SET_PLAYER', playerId: res.playerId || '', username: username.trim() });
      onNavigate('lobby', { roomCode: roomCode.trim().toUpperCase(), username: username.trim(), playerId: res.playerId || '' });
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="font-display text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 mb-4">
          Prompt Battle
        </h1>
        <h1 className="font-display text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-primary-400 to-secondary-400 mb-6">
          Royale
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Compite creando los mejores prompts para IA. Solo el mejor sobrevive.
        </p>
      </div>

      {!showCreate && !showJoin && (
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
          <button
            onClick={() => setShowCreate(true)}
            className="px-10 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl font-bold text-lg hover:from-primary-500 hover:to-secondary-500 transition-all duration-300 shadow-lg shadow-primary-500/25"
          >
            Crear Sala
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="px-10 py-4 bg-gray-800 border border-gray-700 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all duration-300"
          >
            Unirse a Sala
          </button>
        </div>
      )}

      {(showCreate || showJoin) && (
        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {showCreate ? 'Crear Sala' : 'Unirse a Sala'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tu nombre</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && (showCreate ? handleCreate() : handleJoin())}
                />
              </div>

              {showJoin && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Código de sala</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Ej: ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors uppercase tracking-widest text-center font-bold text-lg"
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  />
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm text-center animate-shake">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreate(false); setShowJoin(false); setError(''); }}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={showCreate ? handleCreate : handleJoin}
                  disabled={!isValid || loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg font-bold disabled:opacity-50 hover:from-primary-500 hover:to-secondary-500 transition-all duration-300"
                >
                  {loading ? 'Conectando...' : showCreate ? 'Crear' : 'Unirse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
