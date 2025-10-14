import { IGetDeveloperLeaderboardUseCase } from '@/application/useCases/interfaces/admin/leaderboard/IGetDeveloperLeaderboardUseCase';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { TYPES } from '@/types/types';
import { inject, injectable } from 'inversify';

@injectable()
export class GetDeveloperLeaderboardUseCase implements IGetDeveloperLeaderboardUseCase {
  constructor(
    @inject(TYPES.IDeveloperRepository)
    private _developerRepository: IDeveloperRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service
  ) {}
  
  async execute(page = 1, limit = 10, sortBy = 'combined') {
    const { developers, pagination } = await this._developerRepository.getLeaderboard(
      page, limit, sortBy
    );
    
    const formattedDevelopers = await Promise.all(
      developers.map(async (developer: any) => {
        let profilePictureUrl = null;
        
        if (developer.profilePicture) {
          profilePictureUrl = await this._s3Service.generateSignedUrl(developer.profilePicture);
        }
        
        return {
          id: developer._id,
          userId: developer.userId,
          username: developer.username,
          profilePicture: profilePictureUrl || `https://ui-avatars.com/api/?name=${developer.username || 'Developer'}`,
          expertise: developer.expertise || [],
          rating: developer.rating,
          totalSessions: developer.totalSessions,
          totalEarnings: developer.totalEarnings,
          combinedScore: developer.combinedScore,
          bio: developer.bio
        };
      })
    );
    
    return {
      developers: formattedDevelopers,
      pagination
    };
  }
} 