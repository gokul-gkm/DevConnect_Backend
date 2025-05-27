import { IDeveloper } from "@/domain/entities/Developer";
import { AppError } from "@/domain/errors/AppError";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";

export class GetDeveloperDetailsUseCase {
    constructor(
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) { }

    async execute(developerId: string): Promise<IDeveloper> {
        const developer = await this.developerRepository.findDeveloperDetails(developerId);
        
        if (!developer) {
            throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
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