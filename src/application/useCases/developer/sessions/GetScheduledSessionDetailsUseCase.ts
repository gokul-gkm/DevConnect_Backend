import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { AppError } from '@/domain/errors/AppError';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { StatusCodes } from 'http-status-codes';

export class GetScheduledSessionDetailsUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private s3Service: S3Service
  ) {}

  async execute(sessionId: string, developerId: string) {
    try {
      if (!sessionId) {
        throw new AppError('Session ID is required', StatusCodes.BAD_REQUEST);
      }

      const session = await this.sessionRepository.getScheduledSessionById(
        new Types.ObjectId(sessionId)
      );
      
      if (session.developerId.toString() !== developerId) {
        throw new AppError('Not authorized to access this session', StatusCodes.FORBIDDEN);
      }

      if (session.userId && session.userId.profilePicture) {
        try {
          session.userId.profilePicture = await this.s3Service.generateSignedUrl(session.userId.profilePicture);
        } catch (error) {
          console.error('Error generating signed URL:', error);
          session.userId.profilePicture = '';
        }
      }

      return session;
    } catch (error) {
      console.error('Get scheduled session details use case error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch scheduled session details', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
