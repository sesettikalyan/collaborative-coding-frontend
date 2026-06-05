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
  const response = await api.get<{ success: boolean; data: Room[] }>('/rooms/my');
  return response.data.data;
};

export const createRoom = async (data: { name: string; language: string; maxParticipants?: number }) => {
  const response = await api.post<{ success: boolean; data: Room }>('/rooms', data);
  return response.data.data;
};

export const joinRoomApi = async (roomId: string) => {
  const response = await api.post<{ success: boolean; data: Room }>(`/rooms/${roomId}/join`);
  return response.data.data;
};
