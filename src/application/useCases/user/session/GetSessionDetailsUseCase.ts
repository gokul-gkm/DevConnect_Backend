
import { SessionDetails } from '@/domain/types/session';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { S3Service } from '@/infrastructure/services/S3_Service';

export class GetSessionDetailsUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private s3Service: S3Service
  ) { }

  async execute(sessionId: string): Promise<SessionDetails> {
    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', 400);
    }

    const session = await this.sessionRepository.getSessionBySessionId(new Types.ObjectId(sessionId));

    if (session.developerId.profilePicture) {
      session.developerId.profilePicture = await this.s3Service.generateSignedUrl(session.developerId.profilePicture);
    };
    
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    return session;
  }
}