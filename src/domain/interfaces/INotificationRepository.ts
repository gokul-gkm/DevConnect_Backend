import { INotification } from '../entities/Notification';

export interface INotificationRepository {
  create(notificationData: Partial<INotification>): Promise<INotification>;
  getNotificationsByUserId(userId: string): Promise<INotification[]>;
  markAsRead(notificationId: string): Promise<INotification | null>;
  markAllAsRead(userId: string): Promise<void>;
  softDeleteNotification(notificationId: string): Promise<boolean>;
  countUnreadByUserId(userId: string): Promise<number>;
}