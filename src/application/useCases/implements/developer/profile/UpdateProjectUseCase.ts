import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IProjectRepository } from "@/domain/interfaces/repositories/IProjectRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IUpdateProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IUpdateProjectUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

export interface UpdateProjectDTO {
    projectId: string;
    title: string;
    category: string;
    description: string;
    projectLink?: string;
    coverImage?: Express.Multer.File;
}

@injectable()
export class UpdateProjectUseCase implements IUpdateProjectUseCase{
    constructor(
        @inject(TYPES.IProjectRepository) private _projectRepository: IProjectRepository,
        @inject(TYPES.IS3Service) private _s3Service: IS3Service
    ) {}

    async execute(data: UpdateProjectDTO): Promise<{ [key: string]: any }> {
        let coverImageKey: string | undefined;
        let coverImageUrl: string | undefined;

        try {
            const existingProject = await this._projectRepository.getProjectById(data.projectId);

            if (!existingProject) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }

            const updateData: any = {
                title: data.title,
                category: data.category,
                description: data.description,
            };

            updateData.projectLink = data.projectLink;
          

            if (data.coverImage) {
                if (existingProject.coverImage) {
                    try {
                        await this._s3Service.deleteFile(existingProject.coverImage);
                        console.log('Old cover image deleted successfully');
                    } catch (error) {
                        console.error('Error deleting old cover image:', error);
                    }
                }

                const uploadResult = await this._s3Service.uploadFile(data.coverImage, 'project-covers');
                coverImageKey = uploadResult.Key;
                coverImageUrl = await this._s3Service.generateSignedUrl(coverImageKey);
                updateData.coverImage = coverImageKey;
            }

            const updatedProject = await this._projectRepository.updateProject(
                data.projectId,
                updateData
            );

            return { ...updatedProject, coverImageUrl };
        } catch (error) {
            if (coverImageKey) {
                await this._s3Service.deleteFile(coverImageKey);
            }
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to update project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}



