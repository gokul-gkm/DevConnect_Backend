import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { ISession } from '@/domain/entities/Session';
import { IGetSessionRequestsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetSessionRequestsUseCase';

export class GetSessionRequestsUseCase implements IGetSessionRequestsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository, 
    private _s3Service: IS3Service
  ) {}

  async execute(developerId: string, page: number = 1, limit: number = 5) {
    try {
      if (!developerId) {
        throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.BAD_REQUEST);
      }

      const result = await this._sessionRepository.getSessionRequests(
        new Types.ObjectId(developerId),
        page,
        limit
      );
      
      const sessionsWithSignedUrls = await Promise.all(
        result.sessions.map(async (session:ISession) => {
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
        ...result,
        sessions: sessionsWithSignedUrls
      };
    } catch (error) {
      console.error('Get session requests error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch session requests', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}