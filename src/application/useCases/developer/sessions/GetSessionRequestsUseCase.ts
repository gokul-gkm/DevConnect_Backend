import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

export class GetSessionRequestsUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(developerId: string) {
    try {
      if (!developerId) {
        throw new AppError('Developer ID is required', StatusCodes.BAD_REQUEST);
      }

      const sessions = await this.sessionRepository.getSessionRequests(
        new Types.ObjectId(developerId)
      );
      return sessions;
    } catch (error) {
      console.error('Get session requests error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch session requests', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}