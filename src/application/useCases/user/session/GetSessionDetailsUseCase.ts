
import { SessionDetails } from '@/domain/types/session';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { StatusCodes } from 'http-status-codes';
import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';

export class GetSessionDetailsUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private s3Service: S3Service,
    private ratingRepository: IRatingRepository
  ) { }

  async execute(sessionId: string): Promise<SessionDetails> {
    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', StatusCodes.BAD_REQUEST);
    }

    const session = await this.sessionRepository.getSessionBySessionId(new Types.ObjectId(sessionId));
    const rating = await this.ratingRepository.getRatingBySessionId(sessionId)

    if (session.developerId.profilePicture) {
      session.developerId.profilePicture = await this.s3Service.generateSignedUrl(session.developerId.profilePicture);
    };
    
    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }

    return {
      ...session,
      rating: rating ? rating.rating : undefined,
      feedback: rating ? rating.comment : undefined
    };
  }
}