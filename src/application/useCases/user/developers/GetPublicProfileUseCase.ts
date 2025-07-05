

import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { AppError } from "@/domain/errors/AppError";

export class GetPublicProfileUseCase {
    constructor(
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) {}

    async execute(developerId: string) {
        try {
            const profile = await this.developerRepository.getPublicProfile(developerId);
            
            if (!profile) {
                throw new AppError("Developer profile not found", 404);
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
            throw new AppError("Failed to fetch developer profile", 500);
        }
    }
}
