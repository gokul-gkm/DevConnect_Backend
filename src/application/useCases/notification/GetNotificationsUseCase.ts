import { INotification } from '@/domain/entities/Notification';
import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { StatusCodes } from 'http-status-codes';

export class GetNotificationsUseCase {
  constructor(
    private notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string): Promise<INotification[]> {
    try {
      return await this.notificationRepository.getNotificationsByUserId(userId);
    } catch (error) {
      console.error('Error in GetNotificationsUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to get notifications', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}