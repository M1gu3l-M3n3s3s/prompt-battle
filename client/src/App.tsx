import { useState } from 'react';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

type View = 'home' | 'lobby' | 'game' | 'results';

export interface AppState {
  view: View;
  roomCode: string;
  username: string;
  playerId: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    view: 'home',
    roomCode: '',
    username: '',
    playerId: '',
  });

  const navigate = (view: View, extra?: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, view, ...extra }));
  };

  return (
    <SocketProvider>
      <GameProvider>
        <div className="min-h-screen bg-gray-950 bg-grid">
          {appState.view === 'home' && (
            <HomePage onNavigate={navigate} />
          )}
          {appState.view === 'lobby' && (
            <LobbyPage appState={appState} onNavigate={navigate} />
          )}
          {appState.view === 'game' && (
            <GamePage appState={appState} onNavigate={navigate} />
          )}
          {appState.view === 'results' && (
            <ResultsPage appState={appState} onNavigate={navigate} />
          )}
        </div>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;
