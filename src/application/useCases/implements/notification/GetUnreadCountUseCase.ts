import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { StatusCodes } from 'http-status-codes';
import { IGetUnreadCountUseCase } from '../../interfaces/notification/IGetUnreadCountUseCase';

export class GetUnreadCountUseCase implements IGetUnreadCountUseCase {
  constructor(
    private _notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string): Promise<number> {
    try {
      return await this._notificationRepository.countUnreadByUserId(userId);
    } catch (error) {
      console.error('Error in GetUnreadCountUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to get unread notification count', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}