import { S3Service } from "@/infrastructure/services/S3_Service";
import { AppError } from "@/domain/errors/AppError";
import { AddProjectDTO } from "@/application/dto/developer/AddProjectDTO";
import { ProjectRepository } from "@/infrastructure/repositories/ProjectRepository";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";

export class AddProjectUseCase {
    constructor(
        private projectRepository: ProjectRepository,
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) {}

    async execute(developerId: string, data: AddProjectDTO): Promise<any> {
        let coverImageKey: string | undefined;
        let coverImageUrl: string | undefined;

        try {
            if (data.coverImage) {
                const uploadResult = await this.s3Service.uploadFile(data.coverImage, 'project-covers');
                coverImageKey = uploadResult.Key;
                coverImageUrl = await this.s3Service.generateSignedUrl(coverImageKey);
            }

            const project = await this.projectRepository.addProject({
                title: data.title,
                category: data.category,
                description: data.description,
                projectLink: data.projectLink,
                coverImage: coverImageKey 
            });

            const developer = await this.developerRepository.findByUserId(developerId);
            await this.developerRepository.addProjectToPortfolio(developerId, project._id as string);

            return { ...project, coverImageUrl };
        } catch (error) {
            if (coverImageKey) {
                await this.s3Service.deleteFile(coverImageKey);
            }
            throw new AppError('Failed to add project', 500);
        }
    }
}



