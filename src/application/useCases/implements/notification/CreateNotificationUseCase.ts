import { INotification } from '@/domain/entities/Notification';
import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/repositories/INotificationRepository';
import { ISocketService } from '@/domain/interfaces/services/ISocketService';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { ICreateNotificationUseCase } from '../../interfaces/notification/ICreateNotificationUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';
import logger from '@/utils/logger';

@injectable()
export class CreateNotificationUseCase implements ICreateNotificationUseCase {
  constructor(
    @inject(TYPES.INotificationRepository)
    private _notificationRepository: INotificationRepository,
    @inject(TYPES.ISocketService)
    private _socketService: ISocketService
  ) {}

  async execute(
    recipientId: string,
    title: string,
    message: string,
    type: 'message' | 'session' | 'update' | 'alert',
    senderId?: string,
    relatedId?: string
  ): Promise<INotification> {
    try {

      if (!Types.ObjectId.isValid(recipientId)) {
        throw new AppError('Invalid recipient ID format', StatusCodes.BAD_REQUEST);
      }
      if (senderId && !Types.ObjectId.isValid(senderId)) {
        throw new AppError('Invalid sender ID format', StatusCodes.BAD_REQUEST);
      }
      if (relatedId && !Types.ObjectId.isValid(relatedId)) {
        throw new AppError('Invalid related ID format', StatusCodes.BAD_REQUEST);
      }

      const recipientObjectId = new Types.ObjectId(recipientId);
      const senderObjectId = senderId ? new Types.ObjectId(senderId) : undefined;
      const relatedObjectId = relatedId ? new Types.ObjectId(relatedId) : undefined;

      const notificationData: Partial<INotification> = {
        recipient: recipientObjectId,
        title,
        message,
        type,
        isRead: false
      };

      if (senderObjectId) {
        notificationData.sender = senderObjectId;
      }

      if (relatedObjectId) {
        notificationData.relatedId = relatedObjectId;
      }

      const notification = await this._notificationRepository.create(notificationData);
      logger.info("📦 NOTIFICATION_CREATED", {
        notificationId: notification._id,
        recipientId,
        type
      });
      if (this._socketService.isOnline(recipientId)) {
          logger.info("🟢 USER_ONLINE", { recipientId });

      this._socketService.emitNotification(recipientId, {
        type: 'notification:new',
        payload: {
          notification: {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            timestamp: notification.createdAt,
            sender: notification.sender
          }
        }
      });
} else {
  logger.warn("🔴 USER_OFFLINE", { recipientId });
}

      console.log('notification created and emitted')

      return notification;
    } catch (error) {
      console.error('Error in CreateNotificationUseCase:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error instanceof Error && error.message.includes('input must be a 24 character hex string')) {
        throw new AppError('Invalid ID format provided', StatusCodes.BAD_REQUEST);
      }
      
      throw new AppError('Failed to create notification', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}