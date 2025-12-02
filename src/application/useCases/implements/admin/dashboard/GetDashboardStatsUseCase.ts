import { DashboardStats, IGetDashboardStatsUseCase, RevenueDataPoint, TopDeveloperSummary, UserGrowthDataPoint } from "@/application/useCases/interfaces/admin/dashboard/IGetDashboardStatsUseCase";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";
import { ITopDeveloper } from "@/domain/interfaces/types/IDeveloperTypes";

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

  async execute() :Promise<DashboardStats>{
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

  private async getRevenueData(): Promise<RevenueDataPoint[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await this._walletRepository.getMonthlyRevenue(sixMonthsAgo);
    
    return monthlyRevenue.map(({ year, month, revenue }) => ({
      date: new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue
    }));
  }

  private async getUserGrowthData() : Promise<UserGrowthDataPoint[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowthData = await this._userRepository.getMonthlyUserGrowth(sixMonthsAgo);
    
    const monthlyData = new Map<string, UserGrowthDataPoint>();
    
    userGrowthData.forEach(({ year, month, role, count }) => {
            const dateKey = new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
           const entry = monthlyData.get(dateKey) ?? { date: dateKey, users: 0, developers: 0 };
      
            if (role === 'user') entry.users = count;
            if (role === 'developer') entry.developers = count;
      
            monthlyData.set(dateKey, entry);
          });
    
    return Array.from(monthlyData.values()).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  private async getTopDevelopers() : Promise<TopDeveloperSummary[]>{
    const topDevelopers = await this._developerRepository.getTopPerformingDevelopers(5);
    
    const developersWithSignedUrls = await Promise.all(
      topDevelopers.map(async (dev: ITopDeveloper) => {
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
