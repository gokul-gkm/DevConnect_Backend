export interface ISocketService {
    emitToUser(userId: string, event: string, data: any): void;
    emitToDeveloper(developerId: string, event: string, data: any): void;
    emitToChat(chatId: string, event: string, data: any): void;

    isUserOnline(userId: string): boolean;
    isDeveloperOnline(developerId: string): boolean;
    emitUserBlocked(userId: string): void; 
    
    emitNewNotification(userId: string, notification: any): void;
    emitNotificationRead(userId: string, notificationId: string): void;
    emitAllNotificationsRead(userId: string): void;
    emitUnreadNotificationCount(userId: string, count: number): void;
  }
  