import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IGetDeveloperRequestDetailsUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDeveloperRequestDetailsUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IDeveloperPopulated } from "@/domain/interfaces/types/IDeveloperTypes";

@injectable()
export class GetDeveloperRequestDetailsUseCase implements IGetDeveloperRequestDetailsUseCase {
    constructor(
        @inject(TYPES.IDeveloperRepository)
        private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) {}

    async execute(developerId: string):Promise<IDeveloperPopulated | null> {
        const developer = await this._developerRepository.findDeveloperWithDetails(developerId);
        
        if (!developer) {
            throw new AppError('Developer request not found', StatusCodes.NOT_FOUND);
        }

        if (developer.status !== 'pending') {
            throw new AppError('This is not a pending developer request', StatusCodes.BAD_REQUEST);
        }

        if (developer.userId && (developer.userId as any).profilePicture) {
            const signedProfilePictureUrl = await this._s3Service.generateSignedUrl(
                (developer.userId as any).profilePicture
            );
            (developer.userId as any).profilePicture = signedProfilePictureUrl;
        }
        
        if (developer.resume) {
            const signedResumeUrl = await this._s3Service.generateSignedUrl(developer.resume);
            developer.resume = signedResumeUrl;
        }

        return developer;
    }
}