import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";
import { IDeveloper } from "@/domain/entities/Developer";

export class GetDevelopersUseCase {
    constructor(private developerRepository: DeveloperRepository) {}

    async execute(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> {
        try {
            return await this.developerRepository.findDevelopers(queryParams);
        } catch (error) {
            console.error('Error in ListDevelopersUseCase:', error);
            throw error;
        }
    }
}