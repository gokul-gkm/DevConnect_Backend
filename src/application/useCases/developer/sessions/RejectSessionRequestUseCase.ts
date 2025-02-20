import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';

export class RejectSessionRequestUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(sessionId: string, developerId: string, rejectionReason: string) {
    try {
      if (!sessionId || !developerId || !rejectionReason) {
        throw new AppError('Session ID, Developer ID and rejection reason are required', 400);
      }

      const session = await this.sessionRepository.getSessionById(
        new Types.ObjectId(sessionId)
      );

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      if (session.developerId && session.developerId.toString() !== developerId) {
        throw new AppError('Unauthorized to reject this session', 403);
      }

      if (session.status !== 'pending') {
        throw new AppError('Session is not in pending state', 400);
      }

      const updatedSession = await this.sessionRepository.rejectSession(
        new Types.ObjectId(sessionId),
        rejectionReason
      );

      return updatedSession;
    } catch (error) {
      console.error('Reject session request error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject session request', 500);
    }
  }
}