import { HTTP_STATUS_MESSAGES } from '@/utils/constants';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/domain/errors/AppError';

import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { ISocketService } from '@/domain/interfaces/ISocketService';

import { CreateNotificationUseCase } from '@/application/useCases/implements/notification/CreateNotificationUseCase';
import { DeleteNotificationUseCase } from '@/application/useCases/implements/notification/DeleteNotificationUseCase';
import { GetNotificationsUseCase } from '@/application/useCases/implements/notification/GetNotificationsUseCase';
import { GetUnreadCountUseCase } from '@/application/useCases/implements/notification/GetUnreadCountUseCase';
import { MarkAllNotificationsAsReadUseCase } from '@/application/useCases/implements/notification/MarkAllNotificationsAsReadUseCase';
import { MarkNotificationAsReadUseCase } from '@/application/useCases/implements/notification/MarkNotificationAsReadUseCase';

import { IGetNotificationsUseCase } from '@/application/useCases/interfaces/notification/IGetNotificationsUseCase';
import { IMarkNotificationAsReadUseCase } from '@/application/useCases/interfaces/notification/IMarkNotificationAsReadUseCase';
import { IMarkAllNotificationsAsReadUseCase } from '@/application/useCases/interfaces/notification/IMarkAllNotificationsAsReadUseCase';
import { IDeleteNotificationUseCase } from '@/application/useCases/interfaces/notification/IDeleteNotificationUseCase';
import { IGetUnreadCountUseCase } from '@/application/useCases/interfaces/notification/IGetUnreadCountUseCase';
import { ICreateNotificationUseCase } from '@/application/useCases/interfaces/notification/ICreateNotificationUseCase';


export class NotificationController {
  private _getNotificationsUseCase: IGetNotificationsUseCase;
  private _markNotificationAsReadUseCase: IMarkNotificationAsReadUseCase;
  private _markAllNotificationsAsReadUseCase: IMarkAllNotificationsAsReadUseCase;
  private _deleteNotificationUseCase: IDeleteNotificationUseCase;
  private _getUnreadCountUseCase: IGetUnreadCountUseCase;
  private _createNotificationUseCase: ICreateNotificationUseCase;

  constructor(
    private _notificationRepository: INotificationRepository,
    private _socketService: ISocketService
  ) {
    this._getNotificationsUseCase = new GetNotificationsUseCase(_notificationRepository);
    this._markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(_notificationRepository);
    this._markAllNotificationsAsReadUseCase = new MarkAllNotificationsAsReadUseCase(_notificationRepository, _socketService);
    this._deleteNotificationUseCase = new DeleteNotificationUseCase(_notificationRepository);
    this._getUnreadCountUseCase = new GetUnreadCountUseCase(_notificationRepository);
    this._createNotificationUseCase = new CreateNotificationUseCase(_notificationRepository, _socketService);
  }

  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }

      const notifications = await this._getNotificationsUseCase.execute(userId);
      
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
      
      const notification = await this._markNotificationAsReadUseCase.execute(notificationId, userId);
      
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
      
      await this._markAllNotificationsAsReadUseCase.execute(userId);
      
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
      
      const deleted = await this._deleteNotificationUseCase.execute(notificationId, userId);
      
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

      const count = await this._getUnreadCountUseCase.execute(userId);
      
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