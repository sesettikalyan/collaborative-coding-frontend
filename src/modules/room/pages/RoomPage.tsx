import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { getRoomById, leaveRoomApi } from '../../../api/rooms';
import { runCodeApi, ExecutionResponse } from '../../../api/execution';
import { useAuthStore } from '../../../store/authStore';
import { Loader2, Users, Play, LogOut, Code2, Terminal, X, CheckCircle, XCircle } from 'lucide-react';

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
  
  // Execution states
  const [output, setOutput] = useState<ExecutionResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(false);

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

  const handleRunCode = async () => {
    setIsOutputOpen(true);
    setIsExecuting(true);
    setOutput(null);
    try {
      const data = await runCodeApi({
        language: room?.language || 'javascript',
        code,
      });
      setOutput(data);
    } catch (err: any) {
      setOutput({
        stdout: null,
        time: null,
        memory: null,
        stderr: err.response?.data?.message || 'Execution failed',
        compile_output: null,
        message: null,
        status: { id: 13, description: 'Internal Server Error' }
      });
    } finally {
      setIsExecuting(false);
    }
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
              onClick={() => setIsOutputOpen(!isOutputOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
            >
              <Terminal className="w-4 h-4" /> {isOutputOpen ? 'Hide Output' : 'Show Output'}
            </button>
            <button 
              onClick={handleRunCode}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} Run
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

        {/* Output Panel */}
        {isOutputOpen && (
          <div className="h-64 bg-[#0d0d0d] border-t border-gray-800 flex flex-col shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20">
            <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900/80">
              <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                <Terminal className="w-4 h-4" /> Execution Output
              </div>
              <button onClick={() => setIsOutputOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
              {isExecuting ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Running code securely on Judge0...
                </div>
              ) : output ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${output.status.id <= 3 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {output.status.id <= 3 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span className="font-semibold">{output.status.description}</span>
                    {output.time && <span className="ml-auto text-xs opacity-70 bg-black/20 px-2 py-0.5 rounded">{output.time}s • {output.memory}KB</span>}
                  </div>
                  
                  {/* Stdout */}
                  {output.stdout && (
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-widest font-bold">Standard Output</div>
                      <pre className="text-gray-300 bg-black/60 p-3.5 rounded-lg overflow-x-auto border border-gray-800/80 leading-relaxed shadow-inner">{output.stdout}</pre>
                    </div>
                  )}

                  {/* Stderr & Compile Errors */}
                  {(output.stderr || output.compile_output || output.message) && (
                    <div>
                      <div className="text-[11px] text-red-500/70 mb-1.5 uppercase tracking-widest font-bold">Error Output</div>
                      <pre className="text-red-400 bg-red-950/20 p-3.5 rounded-lg overflow-x-auto border border-red-900/30 leading-relaxed shadow-inner">
                        {output.stderr || output.compile_output || output.message}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600 italic h-full flex items-center justify-center">No output available. Click "Run" to execute your code.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
