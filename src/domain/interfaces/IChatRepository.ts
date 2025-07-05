import { IChat } from "@/domain/entities/Chat";

export interface IChatRepository {
  createChat(userId: string, developerId: string): Promise<IChat>;
  getChatById(chatId: string): Promise<IChat | null>;
  getUserChats(userId: string): Promise<IChat[]>;
  getDeveloperChats(developerId: string): Promise<IChat[]>;
  updateLastMessage(chatId: string, message: string, senderType: 'user' | 'developer'): Promise<void>;
  resetUnreadCount(chatId: string, type: 'user' | 'developer'): Promise<void>;
  findChatByParticipants(userId: string, developerId: string): Promise<IChat | null>;
}