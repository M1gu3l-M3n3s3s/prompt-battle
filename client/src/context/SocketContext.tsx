import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket as SocketIOClient } from 'socket.io-client';

interface SocketContextValue {
  socket: SocketIOClient | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<SocketIOClient | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io();
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => { s.close(); };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
