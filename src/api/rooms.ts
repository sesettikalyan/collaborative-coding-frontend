import { api } from './axios';

export interface Room {
  _id: string;
  roomId: string;
  name: string;
  language: string;
  owner: string;
  participants: string[];
  isActive: boolean;
  maxParticipants: number;
  createdAt: string;
  updatedAt: string;
}

export const getMyRooms = async () => {
  const response = await api.get<{ success: boolean; data: { rooms: Room[], count: number } }>('/rooms/my');
  return response.data.data.rooms;
};

export const createRoom = async (data: { name: string; language: string; maxParticipants?: number }) => {
  const response = await api.post<{ success: boolean; data: { room: Room } }>('/rooms', data);
  return response.data.data.room;
};

export const joinRoomApi = async (roomId: string) => {
  const response = await api.post<{ success: boolean; data: { room: Room } }>(`/rooms/${roomId}/join`);
  return response.data.data.room;
};

export const getRoomById = async (roomId: string) => {
  const response = await api.get<{ success: boolean; data: { room: Room } }>(`/rooms/${roomId}`);
  return response.data.data.room;
};

export const leaveRoomApi = async (roomId: string) => {
  await api.delete(`/rooms/${roomId}/leave`);
};

export const updateRoomLanguage = async (roomId: string, language: string) => {
  const response = await api.put<{ success: boolean; data: { room: Room } }>(`/rooms/${roomId}/language`, { language });
  return response.data.data.room;
};

export const deleteRoomApi = async (roomId: string) => {
  await api.delete(`/rooms/${roomId}`);
};
