import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { ISession } from '@/domain/entities/Session';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { StatusCodes } from 'http-status-codes';

export class GetSessionHistoryUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private s3Service: S3Service
  ) {}

  async execute(userId: string, page = 1, limit = 10): Promise<{ sessions: ISession[], pagination: any }> {
    try {
      if (!userId) {
        throw new AppError('User ID is required', StatusCodes.BAD_REQUEST);
      }

      const currentDate = new Date();
      const { sessions, pagination } = await this.sessionRepository.getSessionHistory(userId, currentDate, page, limit);

      const sessionsWithUrls = await Promise.all(
        sessions.map(async (session) => {
            const sessionData = { ...session };
            if (sessionData.developerUser?.profilePicture) {
                try {
                  sessionData.developerUser.profilePicture = await this.s3Service.generateSignedUrl(sessionData.developerUser.profilePicture);
                } catch (error) {
                    console.error('Error getting signed URL:', error);
                    sessionData.developerUser.profilePicture = null;
                }
            }
            return sessionData;
        })
      );

      return { sessions: sessionsWithUrls, pagination };

    } catch (error) {
      console.error('Get session history error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch session history', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
