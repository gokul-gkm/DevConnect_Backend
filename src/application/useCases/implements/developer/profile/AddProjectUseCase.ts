import { AppError } from "@/domain/errors/AppError";
import { AddProjectDTO } from "@/application/dto/developer/AddProjectDTO";
import { StatusCodes } from "http-status-codes";
import { IProjectRepository } from "@/domain/interfaces/repositories/IProjectRepository";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IAddProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IAddProjectUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class AddProjectUseCase implements IAddProjectUseCase {
    constructor(
        @inject(TYPES.IProjectRepository) private _projectRepository: IProjectRepository,
        @inject(TYPES.IDeveloperRepository) private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IS3Service) private _s3Service: IS3Service
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

            await this._developerRepository.addProjectToPortfolio(developerId, project._id as string);

            return { ...project, coverImageUrl };
        } catch (_error) {
            if (coverImageKey) {
                await this._s3Service.deleteFile(coverImageKey);
            }
            throw new AppError('Failed to add project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}



