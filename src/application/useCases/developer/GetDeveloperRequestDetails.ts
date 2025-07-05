import { IDeveloper } from "@/domain/entities/Developer";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { AppError } from "@/domain/errors/AppError";

export class GetDeveloperRequestDetailsUseCase {
    constructor(private developerRepository: DeveloperRepository) {}

    async execute(developerId: string): Promise<IDeveloper> {
        const developer = await this.developerRepository.findDeveloperWithDetails(developerId);
        
        if (!developer) {
            throw new AppError('Developer request not found', 404);
        }

        if (developer.status !== 'pending') {
            throw new AppError('This is not a pending developer request', 400);
        }

        return developer;
    }
}