import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { getRoomById, leaveRoomApi } from '../../../api/rooms';
import { useAuthStore } from '../../../store/authStore';
import { Loader2, Users, Play, LogOut, Code2 } from 'lucide-react';

const SOCKET_EVENTS = {
  CONNECT: 'connect',
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth:success',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_PARTICIPANTS: 'room:participants',
  CODE_CHANGE: 'editor:code_change',
  CODE_SAVE: 'editor:save',
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [code, setCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  
  const isUpdatingRef = useRef(false);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoomById(roomId!),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId || !token || !room) return;

    // Connect to backend socket
    const socketInstance = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
      socketInstance.emit(SOCKET_EVENTS.AUTH, { token });
    });

    socketInstance.on(SOCKET_EVENTS.AUTH_SUCCESS, () => {
      setIsConnected(true);
      socketInstance.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
    });

    socketInstance.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      // Initialize code from the room data if not already set locally
      setCode(data.room.code || '');
    });

    socketInstance.on(SOCKET_EVENTS.ROOM_PARTICIPANTS, (data) => {
      setParticipants(data.participants);
    });

    socketInstance.on(SOCKET_EVENTS.CODE_CHANGE, (data) => {
      // Only update if the change didn't come from us
      if (data.userId !== user?._id) {
        isUpdatingRef.current = true;
        setCode(data.code);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId, token, room, user?._id]);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    
    setCode(value);
    
    // Only emit if this change was triggered by the user typing
    if (!isUpdatingRef.current && socket && isConnected) {
      socket.emit(SOCKET_EVENTS.CODE_CHANGE, { roomId, code: value });
      
      // We can also emit a CODE_SAVE debounced to save to MongoDB
      // For simplicity in MVP, we just broadcast.
    }
    
    isUpdatingRef.current = false;
  };

  const handleLeaveRoom = async () => {
    if (roomId) {
      try {
        await leaveRoomApi(roomId);
      } catch (err) {
        console.error('Failed to leave room API call', err);
      }
      navigate('/dashboard');
    }
  };

  const handleRunCode = () => {
    alert('Code execution coming in Phase 5!');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Code2 className="w-16 h-16 text-gray-700 mb-4" />
        <h2 className="text-2xl font-bold text-white">Room not found</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-indigo-400 hover:text-indigo-300">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar: Participants */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Participants ({participants.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {participants.map((p) => (
            <div key={p.userId} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30 shadow-sm">
                {p.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-200">
                  {p.username} {p.userId === user?._id && '(You)'}
                </span>
                <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
        {/* Editor Toolbar */}
        <div className="h-14 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-gray-200 text-sm truncate max-w-[150px]">{room.name}</span>
            </div>
            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-widest border border-indigo-500/20">
              {room.language}
            </span>
            {!isConnected && (
              <span className="text-xs text-yellow-500 flex items-center gap-1.5 font-medium bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/20">
                <Loader2 className="w-3 h-3 animate-spin"/> Connecting
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRunCode}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4 fill-current" /> Run
            </button>
            <button 
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-4 py-1.5 bg-gray-800 hover:bg-red-500 hover:text-white text-gray-300 text-sm font-semibold rounded-lg transition-colors border border-gray-700 hover:border-red-500"
            >
              <LogOut className="w-4 h-4" /> Leave
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={room.language === 'cpp' ? 'cpp' : room.language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
              padding: { top: 20 },
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          />
        </div>
      </div>
    </div>
  );
}
