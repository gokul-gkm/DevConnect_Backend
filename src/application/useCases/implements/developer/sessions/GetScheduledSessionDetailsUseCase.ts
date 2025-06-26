import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { IGetScheduledSessionDetailsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetScheduledSessionDetailsUseCase';

export class GetScheduledSessionDetailsUseCase implements IGetScheduledSessionDetailsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository,
    private _s3Service: IS3Service
  ) {}

  async execute(sessionId: string, developerId: string) {
    try {
      if (!sessionId) {
        throw new AppError('Session ID is required', StatusCodes.BAD_REQUEST);
      }

      const session = await this._sessionRepository.getScheduledSessionById(
        new Types.ObjectId(sessionId)
      );
      
      if (session.developerId.toString() !== developerId) {
        throw new AppError('Not authorized to access this session', StatusCodes.FORBIDDEN);
      }

      if (session.userId && session.userId.profilePicture) {
        try {
          session.userId.profilePicture = await this._s3Service.generateSignedUrl(session.userId.profilePicture);
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
