import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { StatusCodes } from 'http-status-codes';

export class GetScheduledSessionsUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private s3Service: S3Service
  ) {}

  async execute(developerId: string, page: number, limit: number) {
    try {
      if (!developerId) {
        throw new AppError('Developer ID is required', StatusCodes.BAD_REQUEST);
      }

      const result = await this.sessionRepository.getDeveloperScheduledSessions(
        new Types.ObjectId(developerId),
        page,
        limit
      );

        const sessionsWithSignedUrls = await Promise.all(
            result.sessions.map(async (session) => {
             
              if (session.userId && typeof session.userId === 'object' && 'profilePicture' in session.userId) {
                const userObj = session.userId as any;
                if (userObj.profilePicture) {
                  try {
                    const signedUrl = await this.s3Service.generateSignedUrl(userObj.profilePicture);
                    
                 
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
