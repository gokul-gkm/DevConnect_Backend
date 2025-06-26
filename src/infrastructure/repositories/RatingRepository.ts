import { Types } from 'mongoose';
import { Rating, IRating } from '@/domain/entities/Rating';
import { IRatingRepository } from '@/domain/interfaces/IRatingRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import Developer from '@/domain/entities/Developer';
import { BaseRepository } from './BaseRepository';

export class RatingRepository extends BaseRepository<IRating> implements IRatingRepository {
  constructor() {
    super(Rating)
  }
  async createRating(rating: {
    userId: Types.ObjectId;
    sessionId: Types.ObjectId;
    developerId: Types.ObjectId;
    rating: number;
    comment?: string;
  }): Promise<IRating> {
    try {
      const newRating = new Rating({
        userId: rating.userId,
        sessionId: rating.sessionId,
        developerId: rating.developerId,
        rating: rating.rating,
        comment: rating.comment
      });
      
      await newRating.save();
      
      return newRating;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw new AppError('Failed to create rating', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  
  async getRatingBySessionId(sessionId: string): Promise<IRating | null> {
    try {
      return await Rating.findOne({ sessionId: new Types.ObjectId(sessionId) });
    } catch (error) {
      console.error('Error getting rating by session ID:', error);
      throw new AppError('Failed to get rating', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  
  async updateRating(
    ratingId: string, 
    data: { rating: number; comment?: string }
  ): Promise<IRating | null> {
    try {
      return await Rating.findByIdAndUpdate(
        ratingId,
        { 
          rating: data.rating,
          comment: data.comment 
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating rating:', error);
      throw new AppError('Failed to update rating', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  
  async deleteRating(ratingId: string): Promise<boolean> {
    try {
      const result = await Rating.findByIdAndDelete(ratingId);
      return !!result;
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw new AppError('Failed to delete rating', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  
  async getAverageRatingByDeveloperId(developerId: string): Promise<number> {
    try {
    
      const result = await Rating.aggregate([
        {
          $lookup: {
            from: 'sessions',
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session'
          }
        },
        {
          $unwind: '$session'
        },
        {
          $match: {
            'session.developerId': new Types.ObjectId(developerId)
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      if (result.length > 0) {
        const averageRating = Number(result[0].averageRating.toFixed(1));
        
        await Developer.findOneAndUpdate(
          {userId: developerId},
          { rating: averageRating }
        );
        
        return averageRating;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting average rating:', error);
      throw new AppError('Failed to calculate average rating', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}
    

    async getDeveloperReviews(
      developerId: string, 
      page = 1, 
      limit = 10, 
      search = '', 
      sortOrder = 'newest'
    ): Promise<{
      reviews: any[];
      pagination: { totalPages: number; currentPage: number; totalItems: number };
    }> {
      try {
        const skip = (page - 1) * limit;
        
        let matchQuery: any = { developerId: new Types.ObjectId(developerId) };

        if (search) {
          matchQuery['$or'] = [
            { 'comment': { $regex: search, $options: 'i' } },
            { 'userId.username': { $regex: search, $options: 'i' } },
            { 'sessionId.title': { $regex: search, $options: 'i' } }
          ];
        }
        
        const countPipeline = [
          { 
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userDetails'
            }
          },
          { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'sessions',
              localField: 'sessionId',
              foreignField: '_id',
              as: 'sessionDetails'
            }
          },
          { $unwind: { path: '$sessionDetails', preserveNullAndEmptyArrays: true } },
          {
            $match: search ? {
              developerId: new Types.ObjectId(developerId),
              $or: [
                { comment: { $regex: search, $options: 'i' } },
                { 'userDetails.username': { $regex: search, $options: 'i' } },
                { 'sessionDetails.title': { $regex: search, $options: 'i' } }
              ]
            } : { developerId: new Types.ObjectId(developerId) }
          },
          { $count: 'total' }
        ];
        
        const countResult = await Rating.aggregate(countPipeline);
        const totalItems = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalItems / limit);
        
        let sortStage: any = {};
        switch (sortOrder) {
          case 'highest':
            sortStage = { rating: -1 };
            break;
          case 'lowest':
            sortStage = { rating: 1 };
            break;
          case 'newest':
          default:
            sortStage = { createdAt: -1 };
        }

        const reviews = await Rating.aggregate([
          { 
            $match: { developerId: new Types.ObjectId(developerId) }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userDetails'
            }
          },
          { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'sessions',
              localField: 'sessionId',
              foreignField: '_id',
              as: 'sessionDetails'
            }
          },
          { $unwind: { path: '$sessionDetails', preserveNullAndEmptyArrays: true } },
          {
            $match: search ? {
              $or: [
                { comment: { $regex: search, $options: 'i' } },
                { 'userDetails.username': { $regex: search, $options: 'i' } },
                { 'sessionDetails.title': { $regex: search, $options: 'i' } }
              ]
            } : {}
          },
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              rating: 1,
              comment: 1,
              createdAt: 1,
              userId: {
                _id: '$userDetails._id',
                username: '$userDetails.username',
                profilePicture: '$userDetails.profilePicture'
              },
              sessionId: {
                _id: '$sessionDetails._id',
                title: '$sessionDetails.title',
                sessionDate: '$sessionDetails.sessionDate',
                startTime: '$sessionDetails.startTime'
              }
            }
          }
        ]);
        
        return {
          reviews,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems
          }
        };
      } catch (error) {
        console.error('Error getting developer reviews:', error);
        throw new AppError('Failed to fetch developer reviews', StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
}
