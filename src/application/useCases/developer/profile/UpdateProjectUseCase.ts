import { ProjectRepository } from "@/infrastructure/repositories/ProjectRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";

interface UpdateProjectDTO {
    projectId: string;
    title: string;
    category: string;
    description: string;
    projectLink?: string;
    coverImage?: Express.Multer.File;
}

export class UpdateProjectUseCase {
    constructor(
        private projectRepository: ProjectRepository,
        private s3Service: S3Service
    ) {}

    async execute(data: UpdateProjectDTO): Promise<{ [key: string]: any }> {
        let coverImageKey: string | undefined;
        let coverImageUrl: string | undefined;

        try {
            const existingProject = await this.projectRepository.getProjectById(data.projectId);

            if (!existingProject) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }

            const updateData: any = {
                title: data.title,
                category: data.category,
                description: data.description,
            };

            if (data.projectLink) {
                updateData.projectLink = data.projectLink;
            }

            if (data.coverImage) {
                if (existingProject.coverImage) {
                    try {
                        await this.s3Service.deleteFile(existingProject.coverImage);
                        console.log('Old cover image deleted successfully');
                    } catch (error) {
                        console.error('Error deleting old cover image:', error);
                    }
                }

                const uploadResult = await this.s3Service.uploadFile(data.coverImage, 'project-covers');
                coverImageKey = uploadResult.Key;
                coverImageUrl = await this.s3Service.generateSignedUrl(coverImageKey);
                updateData.coverImage = coverImageKey;
            }

            const updatedProject = await this.projectRepository.updateProject(
                data.projectId,
                updateData
            );

            return { ...updatedProject, coverImageUrl };
        } catch (error) {
            if (coverImageKey) {
                await this.s3Service.deleteFile(coverImageKey);
            }
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to update project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}



