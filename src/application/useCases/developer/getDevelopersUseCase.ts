import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class GetDevelopersUseCase {
    constructor(
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) { }

    async execute(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            const developers = await this.developerRepository.findDevelopers(queryParams);

            const transformedData = await Promise.all(developers.data.map(async (developer) => {
                let signedProfilePictureUrl = null;
                
                if (developer.userId && (developer.userId as any).profilePicture) {
                    signedProfilePictureUrl = await this.s3Service.generateSignedUrl(
                        (developer.userId as any).profilePicture
                    );
                }

                return {
                    ...developer.toObject(),
                    userId: {
                        ...(developer.userId as any).toObject(),
                        profilePicture: signedProfilePictureUrl
                    }
                };
            }));

            return {
                data: transformedData,
                pagination: developers.pagination
            };
        } catch (error) {
            console.error('Error in ListDevelopersUseCase:', error);
            throw error;
        }
    }
}