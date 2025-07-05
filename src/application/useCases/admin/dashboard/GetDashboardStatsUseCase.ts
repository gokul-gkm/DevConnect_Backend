import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { IWalletRepository } from "@/domain/interfaces/IWalletRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class GetDashboardStatsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private developerRepository: IDeveloperRepository,
    private sessionRepository: ISessionRepository,
    private walletRepository: IWalletRepository,
    private s3Service: S3Service
  ) {}

  async execute() {
    const [
      totalUsers,
      totalDevelopers,
      totalRevenue,
      totalSessions,
      revenueData,
      userGrowthData,
      topDevelopers
    ] = await Promise.all([
      this.userRepository.countByRole('user'),
      this.developerRepository.countApproved(),
      this.walletRepository.getTotalRevenue(),
      this.sessionRepository.countCompletedSessions(),
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
    
    const monthlyRevenue = await this.walletRepository.getMonthlyRevenue(sixMonthsAgo);
    
    return monthlyRevenue.map((item: any) => ({
      date: new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: item.revenue
    }));
  }

  private async getUserGrowthData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowthData = await this.userRepository.getMonthlyUserGrowth(sixMonthsAgo);
    
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
    const topDevelopers = await this.developerRepository.getTopPerformingDevelopers(5);
    
    const developersWithSignedUrls = await Promise.all(
      topDevelopers.map(async (dev: any) => {
        let avatarUrl = '/assets/default-avatar.png';
        
        if (dev.user?.profilePicture) {
          try {
            avatarUrl = await this.s3Service.generateSignedUrl(dev.user.profilePicture);
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
