import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { ISession } from '@/domain/entities/Session';
import { IGetScheduledSessionsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetScheduledSessionsUseCase';

export class GetScheduledSessionsUseCase implements IGetScheduledSessionsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository,
    private _s3Service: IS3Service
  ) {}

  async execute(developerId: string, page: number, limit: number) {
    try {
      if (!developerId) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.BAD_REQUEST);
      }

      const result = await this._sessionRepository.getDeveloperScheduledSessions(
        new Types.ObjectId(developerId),
        page,
        limit
      );

        const sessionsWithSignedUrls = await Promise.all(
            result.sessions.map(async (session: ISession) => {
             
              if (session.userId && typeof session.userId === 'object' && 'profilePicture' in session.userId) {
                const userObj = session.userId as any;
                if (userObj.profilePicture) {
                  try {
                    const signedUrl = await this._s3Service.generateSignedUrl(userObj.profilePicture);
                    
                 
                    const newUserObj = userObj.toObject ? 
                      { ...userObj.toObject(), profilePicture: signedUrl } : 
                      { ...userObj, profilePicture: signedUrl };
                    
                    return {
                      ...session.toObject(),
                      userId: newUserObj
                    };
                  } catch (error) {
                    console.error('Error generating signed URL for profile picture:', error);
                  }
                }
              }
              return session;
            })
          );

      return {
        sessions: sessionsWithSignedUrls,
        pagination: result.pagination,
        stats: result.stats
      };

    } catch (error) {
      console.error('Get scheduled sessions use case error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch scheduled sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
