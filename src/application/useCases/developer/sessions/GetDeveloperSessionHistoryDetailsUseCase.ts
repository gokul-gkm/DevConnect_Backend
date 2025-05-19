import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class GetDeveloperSessionHistoryDetailsUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private s3Service: S3Service
  ) {}

  async execute(developerId: string, sessionId: string) {
    const session = await this.sessionRepository.getDeveloperSessionHistoryById(developerId, sessionId);
    if (session && session.user?.profilePicture) {
      session.user.profilePicture = await this.s3Service.generateSignedUrl(session.user.profilePicture);
    }
    return session;
  }
}
