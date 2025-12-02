import { ISession } from "@/domain/entities/Session";
import { IPagination } from "@/domain/types/session";

export interface UpcomingSession extends ISession {
  developerUser: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string | null;
  };
}

export interface IGetUpcomingSessionsUseCase {
  execute(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ sessions: UpcomingSession[]; pagination: IPagination }>;
}