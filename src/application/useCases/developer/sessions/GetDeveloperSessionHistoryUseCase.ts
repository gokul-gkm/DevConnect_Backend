import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetDeveloperSessionHistoryUseCase {
  constructor(private sessionRepository: ISessionRepository) {}

  async execute(developerId: string, page: number, limit: number, search: string) {
    const now = new Date();
    return this.sessionRepository.getDeveloperSessionHistory(developerId, now, page, limit, search);
  }
}
