import { DevRequestDTO } from "@/application/dto/DevRequestDTO";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "@/utils/constants";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IDevRequestUseCase } from "@/application/useCases/interfaces/developer/auth/IDevRequestUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class DevRequestUseCase implements IDevRequestUseCase {
    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
        @inject(TYPES.IDeveloperRepository) private _developerRepository: IDeveloperRepository,
        @inject(TYPES.IS3Service) private _s3Service: IS3Service
    ) {}

    async execute(data: DevRequestDTO, files: { 
        profilePicture?: Express.Multer.File[], 
        resume?: Express.Multer.File[] 
    }): Promise<void> {
        let profilePictureKey: string | undefined;
        let resumeKey: string | undefined;

        try {
            const existingUser = await this._userRepository.findByEmail(data.email);
            if (!existingUser) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            const existingDeveloper = await this._developerRepository.findByUserId(existingUser.id);
            if (existingDeveloper) {
                throw new AppError('Developer profile already exists', StatusCodes.BAD_REQUEST);
            }

            if (files.profilePicture && files.profilePicture[0]) {
                const uploadResult = await this._s3Service.uploadFile(files.profilePicture[0], 'profile-images');
                profilePictureKey = uploadResult.Key;
            }

            if (files.resume && files.resume[0]) {
                const uploadResult = await this._s3Service.uploadFile(files.resume[0], 'resumes');
                resumeKey = uploadResult.Key;
            }

            await this._userRepository.update(existingUser.id, {
                profilePicture: profilePictureKey,
                role: 'developer',
                bio: data.bio,
                socialLinks: {
                    linkedIn: data.linkedin ?? null,
                    github: data.github ?? null,
                    twitter: data.twitter ?? null,
                    portfolio: data.portfolio ?? null,
                },
                skills: data.expertise,
            });

            await this._developerRepository.createDeveloper({
                userId: existingUser.id,
                expertise: data.expertise,
                hourlyRate: data.sessionCost,
                education: {
                    degree: data.degree,
                    institution: data.institution,
                    year: parseInt(data.year),
                },
                languages: data.languages,
                workingExperience: {
                    companyName: data.company,
                    experience: parseInt(data.experience),
                    jobTitle: data.jobTitle,
                },
                resume: resumeKey,
            });
        } catch (error) {
            if (profilePictureKey) {
                await this._s3Service.deleteFile(profilePictureKey);
            }
            if (resumeKey) {
                await this._s3Service.deleteFile(resumeKey);
            }
            throw error;
        }
    }
}



