import { IGetDeveloperSessionHistoryUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryUseCase";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetDeveloperSessionHistoryUseCase implements IGetDeveloperSessionHistoryUseCase {
  constructor(
    private _sessionRepository: ISessionRepository
  ) { }

  async execute(developerId: string, page: number, limit: number, search: string) {
    const now = new Date();
    return this._sessionRepository.getDeveloperSessionHistory(developerId, now, page, limit, search);
  }
}
