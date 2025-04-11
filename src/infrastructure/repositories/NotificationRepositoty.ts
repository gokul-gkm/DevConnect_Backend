import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { INotification, Notification } from '@/domain/entities/Notification';
import  { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

export class NotificationRepository implements INotificationRepository {
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

  async getNotificationsByUserId(userId: string): Promise<INotification[]> {
    try {
      return Notification.find({
        recipient: new Types.ObjectId(userId),
        isDeleted: { $ne: true}
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'username profilePicture')
        .exec();
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