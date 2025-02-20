import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';

export class GetSessionRequestsUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(developerId: string) {
    try {
      if (!developerId) {
        throw new AppError('Developer ID is required', 400);
      }

      const sessions = await this.sessionRepository.getSessionRequests(
        new Types.ObjectId(developerId)
      );
      return sessions;
    } catch (error) {
      console.error('Get session requests error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch session requests', 500);
    }
  }
}