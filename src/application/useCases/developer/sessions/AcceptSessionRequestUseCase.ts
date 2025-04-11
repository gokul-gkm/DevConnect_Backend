import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '@/infrastructure/services/NotificationService';

export class AcceptSessionRequestUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private notificationService: NotificationService
  ) {}

  async execute(sessionId: string, developerId: string) {
    try {
      if (!sessionId || !developerId) {
        throw new AppError('Session ID and Developer ID are required', StatusCodes.BAD_REQUEST);
      }

      const session = await this.sessionRepository.getSessionById(
        new Types.ObjectId(sessionId)
      );

      if (!session) {
        throw new AppError('Session not found', StatusCodes.NOT_FOUND);
      }

      if (session.developerId && session.developerId.toString() !== developerId) {
        throw new AppError('Unauthorized to accept this session', StatusCodes.FORBIDDEN);
      }

      if (session.status !== 'pending') {
        throw new AppError('Session is not in pending state', StatusCodes.BAD_REQUEST);
      }

      const updatedSession = await this.sessionRepository.updateSessionStatus(
        new Types.ObjectId(sessionId),
        'approved'
      );

      if (updatedSession && updatedSession.userId) {
        try {
          const recipientId = updatedSession.userId._id.toString();

          await this.notificationService.notify(
            recipientId,
            'Session Request Accepted',
            `Your session "${updatedSession.title}" has been accepted.`,
            'session',
            developerId,
            sessionId
          );
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError);
        }
      }

      return updatedSession;
    } catch (error) {
      console.error('Accept session request error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to accept session request', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}