export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface UserGrowthDataPoint {
  date: string;
  users: number;
  developers: number;
}

export interface TopDeveloperSummary {
  id: string;
  name: string;
  avatar: string;
  revenue: number;
  sessions: number;
  rating: number;
  expertise: string[];
}

export interface DashboardStats {
  totalUsers: number;
  totalDevelopers: number;
  totalRevenue: number;
  totalSessions: number;
  revenueData: RevenueDataPoint[];
  userGrowthData: UserGrowthDataPoint[];
  topDevelopers: TopDeveloperSummary[];
}

export interface IGetDashboardStatsUseCase {
  execute(): Promise<DashboardStats>;
}
