import { IGetDeveloperLeaderboardUseCase } from '@/application/useCases/interfaces/admin/leaderboard/IGetDeveloperLeaderboardUseCase';
import { IDeveloperRepository } from '@/domain/interfaces/repositories/IDeveloperRepository';
import { IS3Service } from '@/domain/interfaces/services/IS3Service';
import { ILeaderboardResponse } from '@/domain/interfaces/types/IDeveloperTypes';
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
  
  async execute(page = 1, limit = 10, sortBy = 'combined'): Promise<ILeaderboardResponse>  {
    const { developers, pagination } = await this._developerRepository.getLeaderboard(
      page, limit, sortBy
    );
    
    const formattedDevelopers = await Promise.all(
      developers.map(
        async (developer: ILeaderboardResponse['developers'][number]) => {
          let profilePictureUrl: string | null = null;
          
          if (developer.profilePicture) {
            profilePictureUrl = await this._s3Service.generateSignedUrl(developer.profilePicture);
          }
          
          return {
            ...developer,
            profilePicture:
              profilePictureUrl ||
              `https://ui-avatars.com/api/?name=${developer.username || 'Developer'}`
          };
        }
      )
    );
    
    return {
      developers: formattedDevelopers,
      pagination
    };
  }
} 