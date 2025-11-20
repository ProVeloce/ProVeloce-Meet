import { apiClient } from './api-client';

export interface ChatMessage {
  _id?: string;
  meetingId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  message: string;
  timestamp: string;
  createdAt?: string;
}

export interface EncryptedChatMessage {
  _id?: string;
  meetingId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  encryptedMessage: string;
  iv: string;
  timestamp: string;
  createdAt?: string;
}

class ChatApi {
  async getMessages(meetingId: string, token: string, limit = 50, offset = 0): Promise<ChatMessage[] | EncryptedChatMessage[]> {
    return apiClient.get<ChatMessage[] | EncryptedChatMessage[]>(`/chat/${meetingId}?limit=${limit}&offset=${offset}`, token);
  }

  async sendMessage(meetingId: string, message: string, token: string): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>(`/chat/${meetingId}`, { message }, token);
  }

  async sendEncryptedMessage(meetingId: string, encryptedData: { encryptedMessage: string; iv: string }, token: string): Promise<EncryptedChatMessage> {
    return apiClient.post<EncryptedChatMessage>(`/chat/${meetingId}/encrypted`, encryptedData, token);
  }

  async deleteMessage(meetingId: string, messageId: string, token: string): Promise<void> {
    return apiClient.delete<void>(`/chat/${meetingId}/${messageId}`, token);
  }
}

export const chatApi = new ChatApi();

