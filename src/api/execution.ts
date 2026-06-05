import { api } from './axios';

export interface ExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
}

export interface ExecutionResponse {
  stdout: string | null;
  time: string | null;
  memory: number | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

export const runCodeApi = async (data: ExecutionRequest) => {
  const response = await api.post<{ success: boolean; data: ExecutionResponse }>('/execution/run', data);
  return response.data.data;
};
