import { IGetDeveloperMonthlyStatsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperMonthlyStatsUseCase";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetDeveloperMonthlyStatsUseCase implements IGetDeveloperMonthlyStatsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository
  ) { }

  async execute(developerId: string, year: number) {
    return await this._sessionRepository.getDeveloperMonthlyStats(developerId, year);
  }
}
