import { IGetAdminSessionsUseCase } from "@/application/useCases/interfaces/admin/sessions/IGetAdminSessionsUseCase";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";

export class GetAdminSessionsUseCase implements IGetAdminSessionsUseCase {
  constructor(
    private _sessionRepository: ISessionRepository,
    private _s3Service: IS3Service
  ) {}

  async execute(status: string[], page: number = 1, limit: number = 10, search: string = '') {
    const result = await this._sessionRepository.getAdminSessionsList(status, page, limit, search);
    
    const sessionsWithSignedUrls = await Promise.all(
      result.sessions.map(async (session: any) => {
        let userProfilePicture = '/assets/default-avatar.png';
        let developerProfilePicture = '/assets/default-avatar.png';
        
        if (session.user.profilePicture) {
          try {
            userProfilePicture = await this._s3Service.generateSignedUrl(session.user.profilePicture);
          } catch (error) {
            console.error('Error generating signed URL for user profile picture:', error);
          }
        }
        
        if (session.developer.profilePicture) {
          try {
            developerProfilePicture = await this._s3Service.generateSignedUrl(session.developer.profilePicture);
          } catch (error) {
            console.error('Error generating signed URL for developer profile picture:', error);
          }
        }
        
        return {
          ...session,
          user: {
            ...session.user,
            profilePicture: userProfilePicture
          },
          developer: {
            ...session.developer,
            profilePicture: developerProfilePicture
          },
          formattedDate: new Date(session.sessionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          formattedTime: `${new Date(session.startTime).getHours().toString().padStart(2, '0')}:${new Date(session.startTime).getMinutes().toString().padStart(2, '0')}`
        };
      })
    );
    
    return {
      sessions: sessionsWithSignedUrls,
      pagination: result.pagination
    };
  }
}
