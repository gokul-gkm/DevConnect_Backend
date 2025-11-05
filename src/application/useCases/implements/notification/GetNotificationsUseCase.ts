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

  async execute(userId: string): Promise<INotification[]> {
    try {
      return await this._notificationRepository.getNotificationsByUserId(userId);
    } catch (error) {
      console.error('Error in GetNotificationsUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to get notifications', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}