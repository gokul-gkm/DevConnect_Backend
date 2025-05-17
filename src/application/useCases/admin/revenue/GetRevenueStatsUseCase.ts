import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { IWalletRepository } from "@/domain/interfaces/IWalletRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

interface DeveloperEarning {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  sessions: number;
  averageRating: number;
  totalEarnings: number;
}

export class GetRevenueStatsUseCase {
  constructor(
    private walletRepository: IWalletRepository,
    private sessionRepository: ISessionRepository,
    private s3Service: S3Service
  ) {}

  async execute(page: number = 1, limit: number = 10) {
    const [
      totalRevenue,
      platformFees,
      developerEarnings,
      monthlyRevenue,
      totalSessions,
      topEarningDevelopersResult
    ] = await Promise.all([
      this.walletRepository.getTotalRevenue(),
      this.getPlatformFees(),
      this.getDeveloperEarnings(),
      this.getMonthlyRevenue(),
      this.sessionRepository.countCompletedSessions(),
      this.getTopEarningDevelopers(page, limit)
    ]);

    return {
      totalRevenue,
      platformFees,
      developerEarnings,
      sessions: totalSessions,
      monthlyRevenue,
      topEarningDevelopers: topEarningDevelopersResult.developers,
      pagination: topEarningDevelopersResult.pagination
    };
  }

  private async getPlatformFees(): Promise<number> {
    const totalRevenue = await this.walletRepository.getTotalRevenue();
    return totalRevenue * 0.2;
  }

  private async getDeveloperEarnings(): Promise<number> {

    const totalRevenue = await this.walletRepository.getTotalRevenue();
    return totalRevenue * 0.8;
  }

  private async getMonthlyRevenue() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await this.walletRepository.getMonthlyRevenue(twelveMonthsAgo);
    
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
      const result = await this.sessionRepository.getTopEarningDevelopers(page, limit);

      const developersWithSignedUrls = await Promise.all(
        result.developers.map(async (dev: any) => {
          let profilePictureUrl = '/assets/default-avatar.png';
          
          if (dev.profilePicture) {
            try {
              profilePictureUrl = await this.s3Service.generateSignedUrl(dev.profilePicture);
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
