import { IMessage } from '@/domain/entities/Message';

export interface IMessageRepository {
  createMessage(message: Partial<IMessage>): Promise<IMessage>;
  getChatMessages(chatId: string, page: number, limit: number): Promise<{
    messages: IMessage[];
    hasMore: boolean;
    total: number;
  }>;
  markMessagesAsRead(chatId: string, recipientType: "user" | "developer"): Promise<string[]>
}