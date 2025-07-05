import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IProjectRepository } from "@/domain/interfaces/IProjectRepository";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IDeleteProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IDeleteProjectUseCase";

export class DeleteProjectUseCase implements IDeleteProjectUseCase {
    constructor(
        private _projectRepository: IProjectRepository,
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
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