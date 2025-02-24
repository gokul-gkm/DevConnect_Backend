import { IDeveloper } from "@/domain/entities/Developer";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

export class GetDeveloperRequestDetailsUseCase {
    constructor(private developerRepository: DeveloperRepository) {}

    async execute(developerId: string): Promise<IDeveloper> {
        const developer = await this.developerRepository.findDeveloperWithDetails(developerId);
        
        if (!developer) {
            throw new AppError('Developer request not found', StatusCodes.NOT_FOUND);
        }

        if (developer.status !== 'pending') {
            throw new AppError('This is not a pending developer request', StatusCodes.BAD_REQUEST);
        }

        return developer;
    }
}