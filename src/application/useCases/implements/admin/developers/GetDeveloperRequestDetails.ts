import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IGetDeveloperRequestDetailsUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDeveloperRequestDetailsUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import { IDeveloperPopulated } from "@/domain/interfaces/types/IDeveloperTypes";
import { IDeveloper } from "@/domain/entities/Developer";

type PopulatedUser = IDeveloperPopulated['userId'];

function isPopulatedUser(user: IDeveloper['userId'] | PopulatedUser | null | undefined): user is PopulatedUser {
    return Boolean(user && typeof user === 'object' && 'profilePicture' in user);
}

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