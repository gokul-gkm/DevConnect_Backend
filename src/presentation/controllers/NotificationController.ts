import { CreateNotificationUseCase } from '@/application/useCases/notification/CreateNotificationUseCase';
import { DeleteNotificationUseCase } from '@/application/useCases/notification/DeleteNotificationUseCase';
import { GetNotificationsUseCase } from '@/application/useCases/notification/GetNotificationsUseCase';
import { GetUnreadCountUseCase } from '@/application/useCases/notification/GetUnreadCountUseCase';
import { MarkAllNotificationsAsReadUseCase } from '@/application/useCases/notification/MarkAllNotificationsAsReadUseCase';
import { MarkNotificationAsReadUseCase } from '@/application/useCases/notification/MarkNotificationAsReadUseCase';
import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepositoty';
import { SocketService } from '@/infrastructure/services/SocketService';
import { HTTP_STATUS_MESSAGES } from '@/utils/constants';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class NotificationController {
  private getNotificationsUseCase: GetNotificationsUseCase;
  private markNotificationAsReadUseCase: MarkNotificationAsReadUseCase;
  private markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase;
  private deleteNotificationUseCase: DeleteNotificationUseCase;
  private getUnreadCountUseCase: GetUnreadCountUseCase;
  private createNotificationUseCase: CreateNotificationUseCase;

  constructor(
    private notificationRepository: INotificationRepository,
    private socketService: SocketService
  ) {
    this.getNotificationsUseCase = new GetNotificationsUseCase(notificationRepository);
    this.markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationRepository);
    this.markAllNotificationsAsReadUseCase = new MarkAllNotificationsAsReadUseCase(notificationRepository, socketService);
    this.deleteNotificationUseCase = new DeleteNotificationUseCase(notificationRepository);
    this.getUnreadCountUseCase = new GetUnreadCountUseCase(notificationRepository);
    this.createNotificationUseCase = new CreateNotificationUseCase(notificationRepository, socketService);
  }

  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const notifications = await this.getNotificationsUseCase.execute(userId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: notifications
      });
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const { notificationId } = req.params;
      
      const notification = await this.markNotificationAsReadUseCase.execute(notificationId, userId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: notification
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }
      
      await this.markAllNotificationsAsReadUseCase.execute(userId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const { notificationId } = req.params;
      
      const deleted = await this.deleteNotificationUseCase.execute(notificationId, userId);
      
      return res.status(StatusCodes.OK).json({
        success: deleted,
        message: deleted ? 'Notification deleted' : 'Failed to delete notification'
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const count = await this.getUnreadCountUseCase.execute(userId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      
      return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
      });
    }
  }
}