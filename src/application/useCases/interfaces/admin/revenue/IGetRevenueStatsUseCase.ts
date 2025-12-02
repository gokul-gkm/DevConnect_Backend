export interface RevenuePagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  topicPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface RevenueStats {
  totalRevenue: number;
  platformFees: number;
  developerEarnings: number;
  sessions: number;
  monthlyRevenue: { date: string; revenue: number }[];
  topEarningDevelopers: {
    id: string;
    name: string;
    email: string;
    profilePicture: string;
    sessions: number;
    averageRating: number;
    totalEarnings: number;
    ratings: number[];
  }[];
  topicBasedRevenue: {
    topic: string;
    totalRevenue: number;
    sessionCount: number;
    averageRating: number;
  }[];
  pagination: RevenuePagination;
}

export interface IGetRevenueStatsUseCase {
  execute(page: number, limit: number): Promise<RevenueStats>;
}