import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { S3Service } from '@/infrastructure/services/S3_Service';

export class GetSessionRequestsUseCase {
  constructor(
    private sessionRepository: SessionRepository, 
    private s3Service: S3Service
  ) {}

  async execute(developerId: string, page: number = 1, limit: number = 5) {
    try {
      if (!developerId) {
        throw new AppError('Developer ID is required', StatusCodes.BAD_REQUEST);
      }

      const result = await this.sessionRepository.getSessionRequests(
        new Types.ObjectId(developerId),
        page,
        limit
      );
      
      // Generate signed URLs for profile pictures
      const sessionsWithSignedUrls = await Promise.all(
        result.sessions.map(async (session) => {
          // Check if userId is a populated object with profilePicture
          if (session.userId && typeof session.userId === 'object' && 'profilePicture' in session.userId) {
            const userObj = session.userId as any;
            if (userObj.profilePicture) {
              try {
                const signedUrl = await this.s3Service.generateSignedUrl(userObj.profilePicture);
                
                // Create a new object with the modified profile picture
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