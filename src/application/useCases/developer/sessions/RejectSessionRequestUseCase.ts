import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '@/infrastructure/services/NotificationService';

export class RejectSessionRequestUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private notificationService: NotificationService
  ) { }

  async execute(sessionId: string, developerId: string, rejectionReason: string) {
    try {
      if (!sessionId || !developerId || !rejectionReason) {
        throw new AppError('Session ID, Developer ID and rejection reason are required', StatusCodes.BAD_REQUEST);
      }

      const session = await this.sessionRepository.getSessionById(
        new Types.ObjectId(sessionId)
      );

      if (!session) {
        throw new AppError('Session not found', StatusCodes.NOT_FOUND);
      }

      if (session.developerId && session.developerId.toString() !== developerId) {
        throw new AppError('Unauthorized to reject this session', StatusCodes.FORBIDDEN);
      }

      if (session.status !== 'pending') {
        throw new AppError('Session is not in pending state', StatusCodes.BAD_REQUEST);
      }

      const updatedSession = await this.sessionRepository.rejectSession(
        new Types.ObjectId(sessionId),
        rejectionReason
      );

      if (updatedSession && updatedSession.userId) {
        try {
          const recipientId = updatedSession.userId._id.toString();

          await this.notificationService.notify(
            recipientId,
            'Session Request Rejected',
            `Your session "${updatedSession.title}" has been rejected. Reason: ${rejectionReason}`,
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
      console.error('Reject session request error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject session request', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}