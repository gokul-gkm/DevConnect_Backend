

import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

export class GetPublicProfileUseCase {
    constructor(
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) {}

    async execute(developerId: string) {
        try {
            const profile = await this.developerRepository.getPublicProfile(developerId);
            
            if (!profile) {
                throw new AppError("Developer profile not found", StatusCodes.NOT_FOUND);
            }

            let signedProfilePictureUrl = null;
            if (profile.profilePicture) {
                signedProfilePictureUrl = await this.s3Service.generateSignedUrl(profile.profilePicture);
            }

            return {
                ...profile,
                profilePicture: signedProfilePictureUrl,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to fetch developer profile", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
