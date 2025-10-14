import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { ISocketService } from '@/domain/interfaces/ISocketService';
import { StatusCodes } from 'http-status-codes';
import { IMarkAllNotificationsAsReadUseCase } from '../../interfaces/notification/IMarkAllNotificationsAsReadUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class MarkAllNotificationsAsReadUseCase implements IMarkAllNotificationsAsReadUseCase {
  constructor(
    @inject(TYPES.INotificationRepository)
    private _notificationRepository: INotificationRepository,
    @inject(TYPES.ISocketService)
    private _socketService: ISocketService
  ) {}

  async execute(userId: string): Promise<void> {
    try {
      await this._notificationRepository.markAllAsRead(userId);
      
      if (this._socketService.isUserOnline(userId)) {
        this._socketService.emitToUser(userId, 'notification:all-read', null);
      } else if (this._socketService.isDeveloperOnline(userId)) {
        this._socketService.emitToDeveloper(userId, 'notification:all-read', null);
      }
    } catch (error) {
      console.error('Error in MarkAllNotificationsAsReadUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to mark all notifications as read', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}