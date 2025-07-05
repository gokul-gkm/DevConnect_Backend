import { IGetDeveloperSessionHistoryDetailsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryDetailsUseCase";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetDeveloperSessionHistoryDetailsUseCase implements IGetDeveloperSessionHistoryDetailsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository,
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
