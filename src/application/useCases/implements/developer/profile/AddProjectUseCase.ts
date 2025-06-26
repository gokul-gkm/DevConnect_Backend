import { AppError } from "@/domain/errors/AppError";
import { AddProjectDTO } from "@/application/dto/developer/AddProjectDTO";
import { StatusCodes } from "http-status-codes";
import { IProjectRepository } from "@/domain/interfaces/IProjectRepository";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IAddProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IAddProjectUseCase";

export class AddProjectUseCase implements IAddProjectUseCase {
    constructor(
        private _projectRepository: IProjectRepository,
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) {}

    async execute(developerId: string, data: AddProjectDTO): Promise<any> {
        let coverImageKey: string | undefined;
        let coverImageUrl: string | undefined;

        try {
            if (data.coverImage) {
                const uploadResult = await this._s3Service.uploadFile(data.coverImage, 'project-covers');
                coverImageKey = uploadResult.Key;
                coverImageUrl = await this._s3Service.generateSignedUrl(coverImageKey);
            }

            const project = await this._projectRepository.addProject({
                title: data.title,
                category: data.category,
                description: data.description,
                projectLink: data.projectLink,
                coverImage: coverImageKey 
            });

            const developer = await this._developerRepository.findByUserId(developerId);
            await this._developerRepository.addProjectToPortfolio(developerId, project._id as string);

            return { ...project, coverImageUrl };
        } catch (error) {
            if (coverImageKey) {
                await this._s3Service.deleteFile(coverImageKey);
            }
            throw new AppError('Failed to add project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}



