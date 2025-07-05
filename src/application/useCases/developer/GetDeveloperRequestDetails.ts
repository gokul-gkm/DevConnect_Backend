import { IDeveloper } from "@/domain/entities/Developer";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { S3Service } from "@/infrastructure/services/S3_Service";


export class GetDeveloperRequestDetailsUseCase {
    constructor(
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) {}

    async execute(developerId: string): Promise<IDeveloper> {
        const developer = await this.developerRepository.findDeveloperWithDetails(developerId);
        
        if (!developer) {
            throw new AppError('Developer request not found', StatusCodes.NOT_FOUND);
        }

        if (developer.status !== 'pending') {
            throw new AppError('This is not a pending developer request', StatusCodes.BAD_REQUEST);
        }

        if (developer.userId && (developer.userId as any).profilePicture) {
            const signedProfilePictureUrl = await this.s3Service.generateSignedUrl(
                (developer.userId as any).profilePicture
            );
            (developer.userId as any).profilePicture = signedProfilePictureUrl;
        }
        
        if (developer.resume) {
            const signedResumeUrl = await this.s3Service.generateSignedUrl(developer.resume);
            developer.resume = signedResumeUrl;
        }

        return developer;
    }
}