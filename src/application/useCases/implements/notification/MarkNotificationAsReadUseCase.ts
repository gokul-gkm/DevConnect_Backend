import { INotification } from '@/domain/entities/Notification';
import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { StatusCodes } from 'http-status-codes';
import { IMarkNotificationAsReadUseCase } from '../../interfaces/notification/IMarkNotificationAsReadUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class MarkNotificationAsReadUseCase implements IMarkNotificationAsReadUseCase {
  constructor(
    @inject(TYPES.INotificationRepository)
    private _notificationRepository: INotificationRepository
  ) {}

  async execute(notificationId: string, userId: string): Promise<INotification | null> {
    try {
      const notification = await this._notificationRepository.markAsRead(notificationId);
      
      if (!notification) {
        throw new AppError('Notification not found', StatusCodes.NOT_FOUND);
      }
      
      if (notification.recipient.toString() !== userId) {
        throw new AppError('Not authorized to update this notification', StatusCodes.UNAUTHORIZED);
      }
      
      return notification;
    } catch (error) {
      console.error('Error in MarkNotificationAsReadUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to mark notification as read', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}