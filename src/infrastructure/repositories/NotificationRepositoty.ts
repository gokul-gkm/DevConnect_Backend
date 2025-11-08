import { INotificationRepository } from '@/domain/interfaces/repositories/INotificationRepository';
import { INotification, Notification } from '@/domain/entities/Notification';
import  { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { BaseRepository } from './BaseRepository';
import { injectable } from 'inversify';

@injectable()
export class NotificationRepository extends BaseRepository<INotification> implements INotificationRepository {
  constructor() {
    super(Notification)
  }
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new AppError('Failed to create notification', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }


  async getNotificationsByUserId(userId: string, page = 1, limit = 10): Promise<{
    items: INotification[];
    pagination: { page: number; limit: number; totalPages: number; totalItems: number };
    totalsByType: { message: number; session: number; update: number; alert: number };
  }> {
    try {
      const filter = {
        recipient: new Types.ObjectId(userId),
        isDeleted: { $ne: true }
      };

      const totalItems = await Notification.countDocuments(filter).exec();
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const currentPage = Math.min(Math.max(1, page), totalPages);

      const items = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .populate('sender', 'username profilePicture')
        .exec();

      const grouped = await Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).exec();

      const totalsByType = {
        message: 0,
        session: 0,
        update: 0,
        alert: 0
      } as { message: number; session: number; update: number; alert: number };

      for (const g of grouped) {
        if (g._id in totalsByType) {
          totalsByType[g._id as keyof typeof totalsByType] = g.count;
        }
      }

      return {
        items,
        pagination: {
          page: currentPage,
          limit,
          totalPages,
          totalItems
        },
        totalsByType
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new AppError('Failed to fetch notifications', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }


  async markAsRead(notificationId: string): Promise<INotification | null> {
    try {
      return Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      ).exec();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new AppError('Failed to update notification', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { recipient: new Types.ObjectId(userId), isRead: false },
        { isRead: true }
      ).exec();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new AppError('Failed to update notifications', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async softDeleteNotification(notificationId: string): Promise<boolean> {
    try {
      const result = await Notification.findByIdAndUpdate(
        notificationId,
        { isDeleted: true },
        { new: true }
      ).exec();
      return !!result;
    } catch (error) {
      console.error('Error soft deleting notification:', error);
      throw new AppError('Failed to delete notification', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    try {
      return Notification.countDocuments({ 
        recipient: new Types.ObjectId(userId), 
        isRead: false,
        isDeleted: {$ne: true}
      }).exec();
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      throw new AppError('Failed to count notifications', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}