import { AppError } from '@/domain/errors/AppError';
import { ISession } from '@/domain/entities/Session';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { ISessionRepository } from '@/domain/interfaces/repositories/ISessionRepository';
import { IS3Service } from '@/domain/interfaces/services/IS3Service';
import { IGetSessionHistoryUseCase } from '@/application/useCases/interfaces/user/session/IGetSessionHistoryUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';
import { IPagination } from '@/domain/types/session';

@injectable()
export class GetSessionHistoryUseCase implements IGetSessionHistoryUseCase {
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service
  ) {}

  async execute(userId: string, page = 1, limit = 10): Promise<{ sessions: ISession[], pagination: IPagination }> {
    try {
      if (!userId) {
        throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.BAD_REQUEST);
      }

      const currentDate = new Date();
      const { sessions, pagination } = await this._sessionRepository.getSessionHistory(userId, currentDate, page, limit);

      const sessionsWithUrls = await Promise.all(
        sessions.map(async (session: any) => {
            const sessionData = { ...session };
            if (sessionData.developerUser?.profilePicture) {
                try {
                  sessionData.developerUser.profilePicture = await this._s3Service.generateSignedUrl(sessionData.developerUser.profilePicture);
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
