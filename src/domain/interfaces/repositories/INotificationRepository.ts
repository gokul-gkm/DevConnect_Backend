import { BaseRepository } from '@/infrastructure/repositories/BaseRepository';
import { INotification } from '../../entities/Notification';

export interface INotificationRepository extends BaseRepository<INotification> {
  create(notificationData: Partial<INotification>): Promise<INotification>;
  getNotificationsByUserId(userId: string, page :number, limit:number): Promise<{
    items: INotification[];
    pagination: { page: number; limit: number; totalPages: number; totalItems: number };
    totalsByType: { message: number; session: number; update: number; alert: number };
  }>
  markAsRead(notificationId: string): Promise<INotification | null>;
  markAllAsRead(userId: string): Promise<void>;
  softDeleteNotification(notificationId: string): Promise<boolean>;
  countUnreadByUserId(userId: string): Promise<number>;
}