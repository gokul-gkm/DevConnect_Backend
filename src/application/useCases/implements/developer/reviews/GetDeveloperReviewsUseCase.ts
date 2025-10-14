import { IGetDeveloperReviewsUseCase } from '@/application/useCases/interfaces/developer/reviews/IGetDeveloperReviewsUseCase';
import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { TYPES } from '@/types/types';
import { inject, injectable } from 'inversify';

@injectable()
export class GetDeveloperReviewsUseCase implements IGetDeveloperReviewsUseCase {
  constructor(
    @inject(TYPES.IRatingRepository) private _ratingRepository: IRatingRepository,
    @inject(TYPES.IS3Service) private _s3Service: IS3Service
  ) {}
  
  async execute(
    developerId: string, 
    page = 1, 
    limit = 10, 
    search = '', 
    sortOrder = 'newest'
  ) {
    const { reviews, pagination } = await this._ratingRepository.getDeveloperReviews(
      developerId, page, limit, search, sortOrder
    );
    
    const formattedReviews = await Promise.all(
      reviews.map(async (review) => {
        let profilePicture = null;
        
        if (review.userId && review.userId.profilePicture) {
          profilePicture = await this._s3Service.generateSignedUrl(review.userId.profilePicture);
        }
        
        return {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          user: {
            id: review.userId?._id,
            username: review.userId?.username || 'Anonymous',
            profilePicture: profilePicture || `https://ui-avatars.com/api/?name=${review.userId?.username || 'User'}`
          },
          session: {
            id: review.sessionId?._id,
            title: review.sessionId?.title || 'Unknown Session',
            date: review.sessionId?.sessionDate,
            startTime: review.sessionId?.startTime
          }
        };
      })
    );
    
    return {
      reviews: formattedReviews,
      pagination,
      stats: {
        averageRating: reviews.length > 0 
          ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
          : 0,
        totalReviews: pagination.totalItems
      }
    };
  }
}
