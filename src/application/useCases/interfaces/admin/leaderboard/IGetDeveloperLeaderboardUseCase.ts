import { ILeaderboardResponse } from "@/domain/interfaces/types/IDeveloperTypes";

export interface IGetDeveloperLeaderboardUseCase {
    execute(page: number, limit: number, sortBy: string): Promise<ILeaderboardResponse>;
}