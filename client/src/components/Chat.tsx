import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

interface Props {
  roomCode: string;
}

export default function Chat({ roomCode }: Props) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('chat_message', handler);
    return () => { socket.off('chat_message', handler); };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !input.trim()) return;
    socket.emit('chat_message', { roomCode, text: input.trim() });
    setInput('');
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 flex flex-col h-80">
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-bold">Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className="animate-fade-in">
            <span className="text-primary-400 text-sm font-medium">{msg.username}: </span>
            <span className="text-gray-300 text-sm">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe un mensaje..."
            maxLength={200}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-4 py-2 bg-primary-600 rounded-lg text-sm font-medium hover:bg-primary-500 disabled:opacity-50 transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
