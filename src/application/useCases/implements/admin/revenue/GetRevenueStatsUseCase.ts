import { IGetRevenueStatsUseCase, RevenueStats } from "@/application/useCases/interfaces/admin/revenue/IGetRevenueStatsUseCase";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";
import { ITopEarningDeveloper } from "@/domain/types/session";

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

@injectable()
export class GetRevenueStatsUseCase implements IGetRevenueStatsUseCase {
  constructor(
    @inject(TYPES.IWalletRepository)
    private _walletRepository: IWalletRepository,
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service
  ) {}

  async execute(page: number = 1, limit: number = 10): Promise<RevenueStats> {
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

  private async getMonthlyRevenue():Promise<{ date: string; revenue: number }[]>  {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyRevenue = await this._walletRepository.getMonthlyRevenue(twelveMonthsAgo);
    
    return monthlyRevenue.map(({ year, month, revenue }) => ({
      date: new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue
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
        result.developers.map(async (dev: ITopEarningDeveloper): Promise<DeveloperEarning> => {
          let profilePictureUrl = '/assets/default-avatar.png';
          
          if (dev.profilePicture) {
            try {
              profilePictureUrl = await this._s3Service.generateSignedUrl(dev.profilePicture);
            } catch (error) {
              console.error('Error generating signed URL for profile picture:', error);
            }
          }
          
          return {
            id: dev.id.toString(),
            name: dev.name,
            email: dev.email,
            profilePicture: profilePictureUrl,
            sessions: dev.sessions,
            averageRating: dev.averageRating,
            totalEarnings: dev.totalEarnings,
            ratings: dev.ratings,
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
