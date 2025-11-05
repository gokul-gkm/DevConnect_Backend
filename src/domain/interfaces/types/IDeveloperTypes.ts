import { IDeveloper } from '@/domain/entities/Developer';
import { IUser } from '@/domain/entities/User';

export interface IDeveloperPopulated extends Omit<IDeveloper, "userId"> {
  userId: IUser & Partial<Pick<IUser, "socialLinks">>;
}

export interface IDeveloperAggregateResult extends IUser {
  developerProfile: {
    title: string;
    skills: string[];
    languages: string[];
    hourlyRate: number;
    bio: string;
  };
}

export interface ITopDeveloper {
  _id: string;
  user: { username: string; profilePicture: string };
  expertise: string[];
  rating: number;
  completedSessions: number;
  revenue: number;
}

interface ILeaderboardDeveloper {
  _id: string;
  username: string;
  profilePicture?: string;
  rating: number;
  totalSessions: number;
  totalEarnings: number;
  combinedScore: number;
}

export interface ILeaderboardResponse {
  developers: ILeaderboardDeveloper[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}
