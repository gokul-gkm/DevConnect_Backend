import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { StatusCodes } from 'http-status-codes';
import { IDeleteNotificationUseCase } from '../../interfaces/notification/IDeleteNotificationUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class DeleteNotificationUseCase implements IDeleteNotificationUseCase {
  constructor(
    @inject(TYPES.INotificationRepository)
    private _notificationRepository: INotificationRepository
  ) {}

  async execute(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = await this._notificationRepository.markAsRead(notificationId);
      
      if (!notification) {
        throw new AppError('Notification not found', StatusCodes.NOT_FOUND);
      }
      
      if (notification.recipient.toString() !== userId) {
        throw new AppError('Not authorized to delete this notification', StatusCodes.UNAUTHORIZED);
      }
      
      return await this._notificationRepository.softDeleteNotification(notificationId);
    } catch (error) {
      console.error('Error in DeleteNotificationUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to delete notification', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}