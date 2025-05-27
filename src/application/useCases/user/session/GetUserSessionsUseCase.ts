import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { ISession } from '@/domain/entities/Session';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';

export class GetUserSessionsUseCase {
  constructor(
    private sessionRepository: SessionRepository,
  ) {}

  async execute(userId: string): Promise<ISession[]> {
    try {
      if (!userId) {
        throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.BAD_REQUEST);
      }

      const sessions = await this.sessionRepository.getUserSessions(userId);

      return sessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch user sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}