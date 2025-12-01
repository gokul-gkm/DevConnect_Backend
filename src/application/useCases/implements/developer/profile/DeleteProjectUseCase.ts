import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IProjectRepository } from "@/domain/interfaces/repositories/IProjectRepository";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IDeleteProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IDeleteProjectUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class DeleteProjectUseCase implements IDeleteProjectUseCase {
    constructor(
        @inject(TYPES.IProjectRepository) private _projectRepository: IProjectRepository,
        @inject(TYPES.IDeveloperRepository) private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IS3Service) private _s3Service: IS3Service
    ) { }

    async execute(developerId: string, projectId: string) {
        try {
            const project = await this._projectRepository.getProjectById(projectId);
            
            if (!project) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }
            if (project.coverImage) {
                await this._s3Service.deleteFile(project.coverImage); 
            }
            await this._developerRepository.removeProjectFromPortfolio(developerId, projectId);
            await this._projectRepository.deleteProject( projectId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to delete project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}