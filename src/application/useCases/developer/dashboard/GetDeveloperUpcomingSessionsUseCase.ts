import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class GetDeveloperUpcomingSessionsUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private s3Service: S3Service
  ) {}

  async execute(developerId: string, limit = 2) {
    const sessions = await this.sessionRepository.getDeveloperUpcomingSessions(developerId, limit);

    const sessionsWithSignedUrls = await Promise.all(
      sessions.map(async (session: any) => {
        if (session.userId && typeof session.userId === 'object' && 'profilePicture' in session.userId) {
          const userObj = session.userId as any;
          if (userObj.profilePicture) {
            try {
              const signedUrl = await this.s3Service.generateSignedUrl(userObj.profilePicture);
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
