import { IGetDashboardStatsUseCase } from "@/application/useCases/interfaces/admin/dashboard/IGetDashboardStatsUseCase";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { IWalletRepository } from "@/domain/interfaces/IWalletRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetDashboardStatsUseCase  implements IGetDashboardStatsUseCase{
  constructor(
    @inject(TYPES.IUserRepository)
    private _userRepository: IUserRepository,
    @inject(TYPES.IDeveloperRepository)
    private _developerRepository: IDeveloperRepository,
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IWalletRepository)
    private _walletRepository: IWalletRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service
  ) {}

  async execute() :Promise<any>{
    const [
      totalUsers,
      totalDevelopers,
      totalRevenue,
      totalSessions,
      revenueData,
      userGrowthData,
      topDevelopers
    ] = await Promise.all([
      this._userRepository.countByRole('user'),
      this._developerRepository.countApproved(),
      this._walletRepository.getTotalRevenue(),
      this._sessionRepository.countCompletedSessions(),
      this.getRevenueData(),
      this.getUserGrowthData(),
      this.getTopDevelopers()
    ]);

    return {
      totalUsers,
      totalDevelopers,
      totalRevenue,
      totalSessions,
      revenueData,
      userGrowthData,
      topDevelopers
    };
  }

  private async getRevenueData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await this._walletRepository.getMonthlyRevenue(sixMonthsAgo);
    
    return monthlyRevenue.map((item: any) => ({
      date: new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: item.revenue
    }));
  }

  private async getUserGrowthData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowthData = await this._userRepository.getMonthlyUserGrowth(sixMonthsAgo);
    
    const monthlyData = new Map();
    
    userGrowthData.forEach((item: any) => {
      const dateKey = new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthlyData.has(dateKey)) {
        monthlyData.set(dateKey, {
          date: dateKey,
          users: 0,
          developers: 0
        });
      }
      
      const entry = monthlyData.get(dateKey);
      if (item.role === 'user') {
        entry.users = item.count;
      } else if (item.role === 'developer') {
        entry.developers = item.count;
      }
    });
    
    return Array.from(monthlyData.values()).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  private async getTopDevelopers() {
    const topDevelopers = await this._developerRepository.getTopPerformingDevelopers(5);
    
    const developersWithSignedUrls = await Promise.all(
      topDevelopers.map(async (dev: any) => {
        let avatarUrl = '/assets/default-avatar.png';
        
        if (dev.user?.profilePicture) {
          try {
            avatarUrl = await this._s3Service.generateSignedUrl(dev.user.profilePicture);
          } catch (error) {
            console.error('Error generating signed URL for profile picture:', error);
          }
        }
        
        return {
          id: dev._id.toString(),
          name: dev.user?.username || 'Unknown',
          avatar: avatarUrl,
          revenue: dev.revenue || 0,
          sessions: dev.completedSessions || 0,
          rating: dev.rating || 0,
          expertise: dev.expertise || []
        };
      })
    );
    
    return developersWithSignedUrls;
  }
}
