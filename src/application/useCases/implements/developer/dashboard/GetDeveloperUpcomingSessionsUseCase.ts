import { IGetDeveloperUpcomingSessionsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperUpcomingSessionsUseCase";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetDeveloperUpcomingSessionsUseCase implements IGetDeveloperUpcomingSessionsUseCase{
  constructor(
    private _sessionRepository: ISessionRepository,
    private _s3Service: IS3Service
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
