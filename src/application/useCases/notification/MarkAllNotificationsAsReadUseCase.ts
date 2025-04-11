import { AppError } from '@/domain/errors/AppError';
import { INotificationRepository } from '@/domain/interfaces/INotificationRepository';
import { SocketService } from '@/infrastructure/services/SocketService';
import { StatusCodes } from 'http-status-codes';

export class MarkAllNotificationsAsReadUseCase {
  constructor(
    private notificationRepository: INotificationRepository,
    private socketService: SocketService
  ) {}

  async execute(userId: string): Promise<void> {
    try {
      await this.notificationRepository.markAllAsRead(userId);
      
      if (this.socketService.isUserOnline(userId)) {
        this.socketService.emitToUser(userId, 'notification:all-read', null);
      } else if (this.socketService.isDeveloperOnline(userId)) {
        this.socketService.emitToDeveloper(userId, 'notification:all-read', null);
      }
    } catch (error) {
      console.error('Error in MarkAllNotificationsAsReadUseCase:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError('Failed to mark all notifications as read', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}