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

            return developers
        } catch (error) {
            console.error('Error in ListDevelopersUseCase:', error);
            throw error;
        }
    }
}