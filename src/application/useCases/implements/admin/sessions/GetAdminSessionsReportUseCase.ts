import { IGetAdminSessionsReportUseCase } from "@/application/useCases/interfaces/admin/sessions/IGetAdminSessionsReportUseCase";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetAdminSessionsReportUseCase implements IGetAdminSessionsReportUseCase {
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepository: ISessionRepository,
    @inject(TYPES.IS3Service) private _s3Service: IS3Service
  ) {}

  async execute(params: {
    status: string[];
    search?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const sessions = await this._sessionRepository.getAdminSessionsReport(
      params.status,
      params.search || '',
      params.fromDate,
      params.toDate
    );

    const sessionsWithSigned = await Promise.all(
      sessions.map(async (s: any) => ({
        ...s,
        user: {
          ...s.user,
          profilePicture: s.user.profilePicture
            ? await this._s3Service.generateSignedUrl(s.user.profilePicture)
            : '/assets/default-avatar.png',
        },
        developer: {
          ...s.developer,
          profilePicture: s.developer.profilePicture
            ? await this._s3Service.generateSignedUrl(s.developer.profilePicture)
            : '/assets/default-avatar.png',
        },
      }))
    );

    const totalAmount = sessions.reduce((sum: any, cur: any) => sum + (cur.price || 0), 0);

    return {
      sessions: sessionsWithSigned,
      totals: { count: sessions.length, amount: totalAmount },
    };
  }
}