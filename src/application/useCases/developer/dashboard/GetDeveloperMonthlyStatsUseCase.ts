import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetDeveloperMonthlyStatsUseCase {
  constructor(private sessionRepository: ISessionRepository) {}

  async execute(developerId: string, year: number) {
    return await this.sessionRepository.getDeveloperMonthlyStats(developerId, year);
  }
}
