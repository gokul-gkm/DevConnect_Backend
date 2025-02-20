import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';

export class AcceptSessionRequestUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(sessionId: string, developerId: string) {
    try {
      if (!sessionId || !developerId) {
        throw new AppError('Session ID and Developer ID are required', 400);
      }

      const session = await this.sessionRepository.getSessionById(
        new Types.ObjectId(sessionId)
      );

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      if (session.developerId && session.developerId.toString() !== developerId) {
        throw new AppError('Unauthorized to accept this session', 403);
      }

      if (session.status !== 'pending') {
        throw new AppError('Session is not in pending state', 400);
      }

      const updatedSession = await this.sessionRepository.updateSessionStatus(
        new Types.ObjectId(sessionId),
        'approved'
      );

      return updatedSession;
    } catch (error) {
      console.error('Accept session request error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to accept session request', 500);
    }
  }
}