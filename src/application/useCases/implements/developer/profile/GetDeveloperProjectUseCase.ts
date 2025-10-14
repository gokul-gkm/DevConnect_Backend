import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IProjectRepository } from "@/domain/interfaces/IProjectRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";

import { IGetDeveloperProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProjectUseCase";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetDeveloperProjectUseCase implements IGetDeveloperProjectUseCase {
    constructor(
        @inject(TYPES.IProjectRepository) private _projectRepository: IProjectRepository,
        @inject(TYPES.IS3Service) private _s3Service: IS3Service
    ) { }

    async execute(projectId: string) {
        try {

            const project = await this._projectRepository.getProjectById(projectId);

            let signedCoverImageUrl = null;
            
            if (project.coverImage) {
                signedCoverImageUrl = await this._s3Service.generateSignedUrl(project.coverImage);
                project.coverImage = signedCoverImageUrl
            }

            return project
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch developer project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}