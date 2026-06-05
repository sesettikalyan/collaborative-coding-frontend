import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Code2, Clock, LogIn, Loader2 } from 'lucide-react';
import { getMyRooms, createRoom, joinRoomApi } from '../../../api/rooms';
import { getUserStatsApi } from '../../../api/auth';
import { useAuthStore } from '../../../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomLang, setNewRoomLang] = useState('javascript');
  const [joinRoomId, setJoinRoomId] = useState('');

  // Fetch Rooms
  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['myRooms'],
    queryFn: getMyRooms,
  });

  // Fetch Stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: getUserStatsApi,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setIsCreateModalOpen(false);
      navigate(`/room/${newRoom.roomId}`);
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinRoomApi,
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setIsJoinModalOpen(false);
      navigate(`/room/${room.roomId}`);
    },
  });

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name: newRoomName, language: newRoomLang });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate(joinRoomId);
  };

  return (
    <div className="w-full space-y-10">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome, {user?.username}</h1>
          <p className="text-gray-400 mt-2 text-lg">Here's what's happening with your collaborative sessions.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 flex-1 md:min-w-[140px] shadow-sm">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Code2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Created</p>
              <p className="text-2xl font-bold text-white">{loadingStats ? '-' : stats?.stats?.roomsCreated || 0}</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 flex-1 md:min-w-[140px] shadow-sm">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Joined</p>
              <p className="text-2xl font-bold text-white">{loadingStats ? '-' : stats?.stats?.roomsJoined || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Room
        </button>
        <button 
          onClick={() => setIsJoinModalOpen(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95 border border-gray-700"
        >
          <LogIn className="w-5 h-5" />
          Join via ID
        </button>
      </div>

      {/* Rooms Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Recent Rooms</h2>
        {loadingRooms ? (
          <div className="flex items-center justify-center py-32 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : rooms?.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/40 border border-gray-800 border-dashed rounded-3xl">
            <Code2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">No rooms yet</h3>
            <p className="text-gray-500 mt-2">Create or join a room to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <motion.div 
                whileHover={{ y: -4 }}
                key={room._id} 
                onClick={() => navigate(`/room/${room.roomId}`)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer transition-all shadow-sm hover:shadow-xl group"
              >
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate pr-2">{room.name}</h3>
                  <span className="px-3 py-1 text-[11px] font-bold bg-gray-800 text-gray-300 rounded-md uppercase tracking-widest">{room.language}</span>
                </div>
                <div className="flex flex-col gap-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-gray-500" /> ID: <span className="font-mono text-gray-300 bg-gray-800/50 px-1.5 rounded">{room.roomId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" /> {room.participants.length} / {room.maxParticipants} participants
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-4 border-t border-gray-800/60 text-xs">
                    <Clock className="w-4 h-4 text-gray-500" /> Last updated: {new Date(room.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Create Collaborative Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                <input required autoFocus value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" placeholder="My Awesome Project" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                <select value={newRoomLang} onChange={(e) => setNewRoomLang(e.target.value)} className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow appearance-none">
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-medium hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors shadow-lg">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Join Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Join Room</h3>
            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room ID</label>
                <input required autoFocus value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-mono" placeholder="e.g. V1StGXR8_Z" />
              </div>
              {joinMutation.isError && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {(joinMutation.error as any)?.response?.data?.message || 'Failed to join room'}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsJoinModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-medium hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={joinMutation.isPending} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition-colors shadow-lg">
                  {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Join Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
