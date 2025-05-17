import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { S3Service } from '@/infrastructure/services/S3_Service';

export class GetDeveloperLeaderboardUseCase {
  constructor(
    private developerRepository: IDeveloperRepository,
    private s3Service: S3Service
  ) {}
  
  async execute(page = 1, limit = 10, sortBy = 'combined') {
    const { developers, pagination } = await this.developerRepository.getLeaderboard(
      page, limit, sortBy
    );
    
    const formattedDevelopers = await Promise.all(
      developers.map(async (developer: any) => {
        let profilePictureUrl = null;
        
        if (developer.profilePicture) {
          profilePictureUrl = await this.s3Service.generateSignedUrl(developer.profilePicture);
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