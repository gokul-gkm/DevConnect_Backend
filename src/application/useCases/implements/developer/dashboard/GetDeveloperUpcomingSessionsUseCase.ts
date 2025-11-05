import { IGetDeveloperUpcomingSessionsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperUpcomingSessionsUseCase";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetDeveloperUpcomingSessionsUseCase implements IGetDeveloperUpcomingSessionsUseCase{
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service) private _s3Service: IS3Service
  ) {}

  async execute(developerId: string, limit = 2) {
    const sessions = await this._sessionRepository.getDeveloperUpcomingSessions(developerId, limit);

    const sessionsWithSignedUrls = await Promise.all(
      sessions.map(async (session: any) => {
        if (session.userId && typeof session.userId === 'object' && 'profilePicture' in session.userId) {
          const userObj = session.userId as any;
          if (userObj.profilePicture) {
            try {
              const signedUrl = await this._s3Service.generateSignedUrl(userObj.profilePicture);
              const newUserObj = userObj.toObject
                ? { ...userObj.toObject(), profilePicture: signedUrl }
                : { ...userObj, profilePicture: signedUrl };
              return {
                ...session.toObject?.() ?? session,
                userId: newUserObj,
              };
            } catch (error) {
            console.log(error)
            }
          }
        }
        return session.toObject?.() ?? session;
      })
    );

    return sessionsWithSignedUrls;
  }
}
