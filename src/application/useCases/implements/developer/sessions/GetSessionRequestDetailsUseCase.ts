
import { SessionDetails } from '@/domain/types/session';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { IGetSessionRequestDetailsUseCase } from '@/application/useCases/interfaces/developer/sessions/IGetSessionRequestDetailsUseCase';

export class GetSessionRequestDetailsUseCase implements IGetSessionRequestDetailsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository,
    private _s3Service: IS3Service
  ) { }

  async execute(sessionId: string): Promise<SessionDetails> {
    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', StatusCodes.BAD_REQUEST);
    }

    const session = await this._sessionRepository.getSessionBySessionId(new Types.ObjectId(sessionId));

    if (session.developerId.profilePicture) {
      session.developerId.profilePicture = await this._s3Service.generateSignedUrl(session.developerId.profilePicture);
    };
    if (session.userId.profilePicture) {
      session.userId.profilePicture = await this._s3Service.generateSignedUrl(session.userId.profilePicture);
    };
    
    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }

    return session;
  }
}