import { IGetRevenueStatsUseCase } from "@/application/useCases/interfaces/admin/revenue/IGetRevenueStatsUseCase";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { IWalletRepository } from "@/domain/interfaces/IWalletRepository";

interface DeveloperEarning {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  sessions: number;
  averageRating: number;
  totalEarnings: number;
  ratings: number[];
}

export class GetRevenueStatsUseCase implements IGetRevenueStatsUseCase {
  constructor(
    private _walletRepository: IWalletRepository,
    private _sessionRepository: ISessionRepository,
    private _s3Service: IS3Service
  ) {}

  async execute(page: number = 1, limit: number = 10) {
    const [
      totalRevenue,
      platformFees,
      developerEarnings,
      monthlyRevenue,
      totalSessions,
      topEarningDevelopersResult,
      topicBasedRevenueResult
    ] = await Promise.all([
      this._walletRepository.getTotalRevenue(),
      this.getPlatformFees(),
      this.getDeveloperEarnings(),
      this.getMonthlyRevenue(),
      this._sessionRepository.countCompletedSessions(),
      this.getTopEarningDevelopers(page, limit),
      this._sessionRepository.getTopicBasedRevenue(page, limit)
    ]);

    return {
      totalRevenue,
      platformFees,
      developerEarnings,
      sessions: totalSessions,
      monthlyRevenue,
      topEarningDevelopers: topEarningDevelopersResult.developers,
      topicBasedRevenue: topicBasedRevenueResult.topics,
      pagination: {
        ...topEarningDevelopersResult.pagination,
        topicPagination: topicBasedRevenueResult.pagination
      }
    };
  }

  private async getPlatformFees(): Promise<number> {
    const totalRevenue = await this._walletRepository.getTotalRevenue();
    return totalRevenue * 0.2;
  }

  private async getDeveloperEarnings(): Promise<number> {

    const totalRevenue = await this._walletRepository.getTotalRevenue();
    return totalRevenue * 0.8;
  }

  private async getMonthlyRevenue() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await this._walletRepository.getMonthlyRevenue(twelveMonthsAgo);
    
    return monthlyRevenue.map((item: any) => ({
      date: new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: item.revenue
    }));
  }

  private async getTopEarningDevelopers(page: number, limit: number): Promise<{
    developers: DeveloperEarning[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  }> {
    try {
      const result = await this._sessionRepository.getTopEarningDevelopers(page, limit);

      const developersWithSignedUrls = await Promise.all(
        result.developers.map(async (dev: any) => {
          let profilePictureUrl = '/assets/default-avatar.png';
          
          if (dev.profilePicture) {
            try {
              profilePictureUrl = await this._s3Service.generateSignedUrl(dev.profilePicture);
            } catch (error) {
              console.error('Error generating signed URL for profile picture:', error);
            }
          }
          
          return {
            ...dev,
            profilePicture: profilePictureUrl
          };
        })
      );
      
      return {
        developers: developersWithSignedUrls,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error fetching top earning developers:', error);
      return {
        developers: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: 0
        }
      };
    }
  }
}
