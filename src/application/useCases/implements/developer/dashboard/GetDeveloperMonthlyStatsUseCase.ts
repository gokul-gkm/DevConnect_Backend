import { IGetDeveloperMonthlyStatsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperMonthlyStatsUseCase";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetDeveloperMonthlyStatsUseCase implements IGetDeveloperMonthlyStatsUseCase {
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepository: ISessionRepository
  ) { }

  async execute(developerId: string, year: number) {
    return await this._sessionRepository.getDeveloperMonthlyStats(developerId, year);
  }
}
