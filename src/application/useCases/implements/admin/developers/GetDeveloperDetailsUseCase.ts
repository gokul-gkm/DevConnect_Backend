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

type PopulatedUser = IDeveloperPopulated['userId'];

function isPopulatedUser(user: IDeveloper['userId'] | PopulatedUser | null | undefined): user is PopulatedUser {
    return Boolean(user && typeof user === 'object' && 'profilePicture' in user);
}

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

        if (isPopulatedUser(developer.userId) && developer.userId.profilePicture) {
            const signedProfilePictureUrl = await this._s3Service.generateSignedUrl(developer.userId.profilePicture);
            developer.userId.profilePicture = signedProfilePictureUrl;
        }

        if (developer.resume) {
            const signedResumeUrl = await this._s3Service.generateSignedUrl(developer.resume);
            developer.resume = signedResumeUrl;
        }

        return developer;
    }
}