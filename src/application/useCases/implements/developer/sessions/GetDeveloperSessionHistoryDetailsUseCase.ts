import { IGetDeveloperSessionHistoryDetailsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryDetailsUseCase";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetDeveloperSessionHistoryDetailsUseCase implements IGetDeveloperSessionHistoryDetailsUseCase {
  constructor(
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service)
    private _s3Service: IS3Service
  ) {}

  async execute(developerId: string, sessionId: string) {
    const session = await this._sessionRepository.getDeveloperSessionHistoryById(developerId, sessionId);
    if (session && session.user?.profilePicture) {
      session.user.profilePicture = await this._s3Service.generateSignedUrl(session.user.profilePicture);
    }
    return session;
  }
}
