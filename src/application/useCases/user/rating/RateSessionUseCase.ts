import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { Types } from 'mongoose';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';

interface RateSessionParams {
  userId: string;
  sessionId: string;
  rating: number;
  comment?: string;
  isUpdate?: boolean;
}

export class RateSessionUseCase {
  constructor(
    private ratingRepository: IRatingRepository,
    private sessionRepository: SessionRepository,
    private notificationService: NotificationService
  ) {}

  async execute(params: RateSessionParams) {
    const { userId, sessionId, rating, comment, isUpdate = false } = params;

    const session = await this.sessionRepository.findById(sessionId);
    
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
    
    const existingRating = await this.ratingRepository.getRatingBySessionId(sessionId);
    
    let ratingData;
    
    if ((existingRating && existingRating._id) || isUpdate) {
      if (!existingRating) {
        throw new AppError('Rating not found, cannot update', StatusCodes.NOT_FOUND);
      }
      
      ratingData = await this.ratingRepository.updateRating(
        existingRating._id as string,
        { rating, comment }
      );
      
      await this.ratingRepository.getAverageRatingByDeveloperId(session.developerId.toString());
    } else {
      ratingData = await this.ratingRepository.createRating({
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId),
        developerId: new Types.ObjectId(session.developerId.toString()),
        rating,
        comment
      });
      
      await this.ratingRepository.getAverageRatingByDeveloperId(session.developerId.toString());
    }
    
    await this.notificationService.notify(
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
