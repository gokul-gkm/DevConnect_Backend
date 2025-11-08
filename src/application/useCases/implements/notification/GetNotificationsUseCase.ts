import { INotification } from '@/domain/entities/Notification';
import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/repositories/INotificationRepository';
import { StatusCodes } from 'http-status-codes';
import { IGetNotificationsUseCase } from '../../interfaces/notification/IGetNotificationsUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class GetNotificationsUseCase implements IGetNotificationsUseCase {
  constructor(
    @inject(TYPES.INotificationRepository)
    private _notificationRepository: INotificationRepository
  ) {}
  
  async execute(userId: string, page = 1, limit = 10): Promise<{
    items: INotification[];
    pagination: { page: number; limit: number; totalPages: number; totalItems: number };
    totalsByType: { message: number; session: number; update: number; alert: number };
  }> {
    try {
      return await this._notificationRepository.getNotificationsByUserId(userId, page, limit);
    } catch (error) {
      console.error('Error in GetNotificationsUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to get notifications', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}