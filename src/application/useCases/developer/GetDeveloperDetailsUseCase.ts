import { IDeveloper } from "@/domain/entities/Developer";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { AppError } from "@/domain/errors/AppError";

export class GetDeveloperDetailsUseCase {
    constructor(private developerRepository: DeveloperRepository) {}

    async execute(developerId: string): Promise<IDeveloper> {
        const developer = await this.developerRepository.findDeveloperDetails(developerId);
        
        if (!developer) {
            throw new AppError('Developer not found', 404);
        }

        return developer;
    }
}