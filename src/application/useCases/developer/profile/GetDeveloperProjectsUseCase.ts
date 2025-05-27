import { ProjectRepository } from "@/infrastructure/repositories/ProjectRepository";
import { AppError } from "@/domain/errors/AppError";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "@/utils/constants";

interface PaginationParams {
    page?: number;
    limit?: number;
}

export class GetDeveloperProjectsUseCase {
    constructor(private projectRepository: ProjectRepository, private s3Service: S3Service) {}

    async execute(userId: string, { page = 1, limit = 5 }: PaginationParams = {}) {
        try {
            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.BAD_REQUEST);
            }

            const validatedPage = Math.max(1, Number(page));
            const validatedLimit = Math.max(1, Math.min(Number(limit), 10));

            const result = await this.projectRepository.getDeveloperProjects(
                userId,
                validatedPage,
                validatedLimit
            );

            const projectsWithUrls = await Promise.all(
                result.projects.map(async (project) => {
                    const projectData = { ...project };
                    if (projectData.coverImage) {
                        try {
                            projectData.coverImage = await this.s3Service.generateSignedUrl(projectData.coverImage);
                        } catch (error) {
                            console.error('Error getting signed URL:', error);
                            projectData.coverImage = null;
                        }
                    }
                    return projectData;
                })
            );

            return {
                ...result,
                projects: projectsWithUrls
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch developer projects', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}