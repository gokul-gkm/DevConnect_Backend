import { IRatingRepository } from '@/domain/interfaces/repositories/IRatingRepository';
import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ISessionRepository } from '@/domain/interfaces/repositories/ISessionRepository';
import { INotificationService } from '@/domain/interfaces/services/INotificationService';
import { IRateSessionUseCase } from '@/application/useCases/interfaces/user/rating/IRateSessionUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

export interface RateSessionParams {
  userId: string;
  sessionId: string;
  rating: number;
  comment?: string;
  isUpdate?: boolean;
}

@injectable()
export class RateSessionUseCase implements IRateSessionUseCase {
  constructor(
    @inject(TYPES.IRatingRepository)
    private _ratingRepository: IRatingRepository,
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.INotificationService)
    private _notificationService: INotificationService
  ) {}

  async execute(params: RateSessionParams) {
    const { userId, sessionId, rating, comment, isUpdate = false } = params;

    const session = await this._sessionRepository.findById(sessionId);
    
    if (!session) {
      throw new AppError('Session not found', StatusCodes.NOT_FOUND);
    }
    
    if (session.status !== 'completed') {
      throw new AppError('Only completed sessions can be rated', StatusCodes.BAD_REQUEST);
    }
    
    if (session.userId && session.userId.toString() !== userId) {
      throw new AppError('You can only rate your own sessions', StatusCodes.FORBIDDEN);
    }
    
    if (!session.developerId) {
      throw new AppError('Developer ID not found for this session', StatusCodes.BAD_REQUEST);
    }
    
    const existingRating = await this._ratingRepository.getRatingBySessionId(sessionId);
    
    let ratingData;
    
    if ((existingRating && existingRating._id) || isUpdate) {
      if (!existingRating) {
        throw new AppError('Rating not found, cannot update', StatusCodes.NOT_FOUND);
      }
      
      ratingData = await this._ratingRepository.updateRating(
        existingRating._id as string,
        { rating, comment }
      );
      
      await this._ratingRepository.getAverageRatingByDeveloperId(session.developerId.toString());
    } else {
      ratingData = await this._ratingRepository.createRating({
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
        developerId: new Types.ObjectId(session.developerId.toString()),
        rating,
        comment
      });
      
      await this._ratingRepository.getAverageRatingByDeveloperId(session.developerId.toString());
    }
    
    await this._notificationService.notify(
      session.developerId.toString(),
      'Session Rating',
      `Your session has been rated with ${rating} stars`,
      'session',
      session.userId?.toString(),
      sessionId
    );
    
    return ratingData;
  }
}
