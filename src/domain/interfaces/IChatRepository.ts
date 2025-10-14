import { IChat } from "@/domain/entities/Chat";
import { IPopulatedChat } from "./IUserRefs";

export interface IChatRepository {
  createChat(userId: string, developerId: string): Promise<IChat>;
  getChatById(chatId: string): Promise<IChat | null>;
  getUserChats(userId: string): Promise<IPopulatedChat[]>;
  getDeveloperChats(developerId: string): Promise<IPopulatedChat[]>;
  updateLastMessage(chatId: string, message: string, senderType: 'user' | 'developer'): Promise<void>;
  resetUnreadCount(chatId: string, type: 'user' | 'developer'): Promise<void>;
  findChatByParticipants(userId: string, developerId: string): Promise<IChat | null>;
}