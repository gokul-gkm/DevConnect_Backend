import { ProjectRepository } from "@/infrastructure/repositories/ProjectRepository";
import { AppError } from "@/domain/errors/AppError";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { StatusCodes } from "http-status-codes";

export class DeleteProjectUseCase {
    constructor(private projectRepository: ProjectRepository, private developerRepository : DeveloperRepository, private s3Service: S3Service) {}

    async execute(developerId: string, projectId: string) {
        try {
            const project = await this.projectRepository.getProjectById(projectId);
            
            if (!project) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }
            if (project.coverImage) {
                await this.s3Service.deleteFile(project.coverImage); 
            }
            await this.developerRepository.removeProjectFromPortfolio(developerId, projectId);
            await this.projectRepository.deleteProject( projectId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to delete project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}