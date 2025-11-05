import { IGetDeveloperDetailsUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDeveloperDetailsUseCase";
import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IDeveloperPopulated } from "@/domain/interfaces/types/IDeveloperTypes";
import { TYPES } from "@/types/types";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";

@injectable()
export class GetDeveloperDetailsUseCase implements IGetDeveloperDetailsUseCase {
    constructor(
        @inject(TYPES.IDeveloperRepository)
        private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) { }

    async execute(developerId: string) : Promise<IDeveloper | IDeveloperPopulated> {
        const developer = await this._developerRepository.findDeveloperDetails(developerId);
        
        if (!developer) {
            throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
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