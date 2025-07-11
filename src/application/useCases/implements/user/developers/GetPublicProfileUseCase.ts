import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Project } from "@/domain/entities/Project";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IGetPublicProfileUseCase } from "@/application/useCases/interfaces/user/developers/IGetPublicProfileUseCase";

export class GetPublicProfileUseCase implements IGetPublicProfileUseCase {
    constructor(
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) {}

    async execute(developerId: string) {
        try {
            const profile = await this._developerRepository.getPublicProfile(developerId);
            
            if (!profile) {
                throw new AppError("Developer profile not found", StatusCodes.NOT_FOUND);
            }

            let signedProfilePictureUrl = null;
            if (profile.profilePicture) {
                signedProfilePictureUrl = await this._s3Service.generateSignedUrl(profile.profilePicture);
            }

            const portfolioProjects = await Project.find({ _id: { $in: profile.developerProfile.portfolio } });
            
            const processedProjects = await Promise.all(portfolioProjects.map(async (project) => {
                let coverImageUrl = null;
                if (project.coverImage) {
                    coverImageUrl = await this._s3Service.generateSignedUrl(project.coverImage);
                }
                return {
                    _id: project._id,
                    title: project.title,
                    category: project.category,
                    description: project.description,
                    projectLink: project.projectLink,
                    coverImage: coverImageUrl,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt
                };
            }));

            return {
                ...profile,
                profilePicture: signedProfilePictureUrl,
                portfolio: processedProjects
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to fetch developer profile", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
