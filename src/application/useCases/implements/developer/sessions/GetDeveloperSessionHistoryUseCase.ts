import { IGetDeveloperSessionHistoryUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryUseCase";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetDeveloperSessionHistoryUseCase implements IGetDeveloperSessionHistoryUseCase {
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository
  ) { }

  async execute(developerId: string, page: number, limit: number, search: string) {
    const now = new Date();
    return this._sessionRepository.getDeveloperSessionHistory(developerId, now, page, limit, search);
  }
}
