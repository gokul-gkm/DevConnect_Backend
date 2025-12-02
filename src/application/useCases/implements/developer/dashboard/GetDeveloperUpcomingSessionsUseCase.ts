import { IGetDeveloperUpcomingSessionsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperUpcomingSessionsUseCase";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";
import { IUpcomingSession, IUserInfo } from "@/domain/types/session";

@injectable()
export class GetDeveloperUpcomingSessionsUseCase implements IGetDeveloperUpcomingSessionsUseCase{
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service) private _s3Service: IS3Service
  ) {}

  async execute(developerId: string, limit = 2): Promise<IUpcomingSession[]>  {
    const sessions = await this._sessionRepository.getDeveloperUpcomingSessions(developerId, limit);

    const sessionsWithSignedUrls = await Promise.all(
      sessions.map(async (session: IUpcomingSession): Promise<IUpcomingSession> => {
        const user = session.userId;

        if (user?.profilePicture) {
          try {
            const signedUrl = await this._s3Service.generateSignedUrl(user.profilePicture);

            return {
              ...session,
              userId: {
                ...user,
                profilePicture: signedUrl,
              } as IUserInfo,
            };
          } catch (error) {
            console.log(error);
          }
        }

        return session;
      })
    );

    return sessionsWithSignedUrls;
  }
}
