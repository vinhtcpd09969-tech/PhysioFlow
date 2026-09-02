import api from '../../../api/axios';

export interface ChatHistoryEntry {
  role: 'user' | 'model';
  content: string;
}

export const sendChatMessage = (data: { message: string; history: ChatHistoryEntry[]; sessionId: string }) =>
  api.post('/ai/chat', data);

export const getMyChatHistory = () =>
  api.get<{ success: boolean; messages: { role: 'user' | 'model'; content: string; created_at: string }[] }>('/ai/chat/history/me');
