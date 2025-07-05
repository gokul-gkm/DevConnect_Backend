import { IGetDeveloperDetailsUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDeveloperDetailsUseCase";
import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";

export class GetDeveloperDetailsUseCase implements IGetDeveloperDetailsUseCase {
    constructor(
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) { }

    async execute(developerId: string): Promise<IDeveloper> {
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