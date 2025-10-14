import { SessionDetails } from '@/domain/types/session';
import { AppError } from '@/domain/errors/AppError';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { IGetSessionDetailsUseCase } from '@/application/useCases/interfaces/user/session/IGetSessionDetailsUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class GetSessionDetailsUseCase implements IGetSessionDetailsUseCase {
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service,
    @inject(TYPES.IRatingRepository)
    private _ratingRepository: IRatingRepository
  ) { }

  async execute(sessionId: string): Promise<SessionDetails> {
    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID', StatusCodes.BAD_REQUEST);
    }

    const session = await this._sessionRepository.getSessionBySessionId(new Types.ObjectId(sessionId));
    const rating = await this._ratingRepository.getRatingBySessionId(sessionId)

    if (session.developerId.profilePicture) {
      session.developerId.profilePicture = await this._s3Service.generateSignedUrl(session.developerId.profilePicture);
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