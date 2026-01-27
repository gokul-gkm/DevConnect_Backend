import { Server as SocketServer } from "socket.io";

export interface ISocketService {
  initialize(io: SocketServer): void;

  emitToChat(chatId: string, event: string, data: any): void;

  emitNotification(userId: string, payload: any): void;
  emitNotificationRead(userId: string, notificationId: string): void;
  emitUnreadCount(userId: string, count: number): void;

  emitToUser(userId: string, event: string, payload: any): void;

  isOnline(userId: string): boolean;
}