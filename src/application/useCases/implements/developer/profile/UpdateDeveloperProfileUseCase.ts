import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ProfileUpdateData } from '@/domain/types/developer';
import { ERROR_MESSAGES } from '@/utils/constants';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { IUpdateDeveloperProfileUseCase } from '@/application/useCases/interfaces/developer/profile/IUpdateDeveloperProfileUseCase';

export class UpdateDeveloperProfileUseCase implements IUpdateDeveloperProfileUseCase {
    constructor(
        private _userRepository: IUserRepository,
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) {}

    async execute(
        userId: string, 
        profileData: ProfileUpdateData, 
        files: { 
            profilePicture?: Express.Multer.File[],
            resume?: Express.Multer.File[]
        }
    ) {
        let profilePictureKey: string | undefined;
        let resumeKey: string | undefined;
        let profilePictureUrl: string | undefined;
        let resumeUrl: string | undefined;

        try {
            const existingUser = await this._userRepository.findById(userId);
            const existingDeveloper = await this._developerRepository.findByUserId(userId);

            if (!existingUser || !existingDeveloper) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            if (files.profilePicture?.[0]) {
                if (existingUser.profilePicture) {
                    try {
                        await this._s3Service.deleteFile(existingUser.profilePicture);
                    } catch (error) {
                        console.error('Error deleting old profile picture');
                    }
                }
                const uploadResult = await this._s3Service.uploadFile(files.profilePicture[0], 'profile-images');
                profilePictureKey = uploadResult.Key;
                profilePictureUrl = await this._s3Service.generateSignedUrl(profilePictureKey);
            }

            if (files.resume?.[0]) {
                if (existingDeveloper.resume) {
                    try {
                        await this._s3Service.deleteFile(existingDeveloper.resume);
                    } catch (error) {
                        console.error('Error deleting old resume');
                    }
                }
                const uploadResult = await this._s3Service.uploadFile(files.resume[0], 'resumes');
                resumeKey = uploadResult.Key;
                resumeUrl = await this._s3Service.generateSignedUrl(resumeKey);
            }

            const userUpdateData = {
                username: profileData.username,
                contact: Number(profileData.contact),
                bio: profileData.bio,
                profilePicture: profilePictureKey,
                socialLinks: {
                    github: profileData.socialLinks?.github,
                    linkedIn: profileData.socialLinks?.linkedIn,
                    twitter: profileData.socialLinks?.twitter,
                    portfolio: profileData.socialLinks?.portfolio
                },
                skills: profileData.skills,
                location: profileData.location
            };


            const developerUpdateData = {
                hourlyRate: Number(profileData.hourlyRate),
                education: {
                    degree: profileData.education?.degree,
                    institution: profileData.education?.institution,
                    year: Number(profileData.education?.year)
                },
                languages: profileData.languages,
                workingExperience: {
                    jobTitle: profileData.workingExperience?.jobTitle,
                    companyName: profileData.workingExperience?.companyName,
                    experience: Number(profileData.workingExperience?.experience)
                },
                expertise: profileData.skills,
                resume: resumeKey 
            };


            const [updatedUser, updatedDeveloper] = await Promise.all([
                this._userRepository.update(userId, userUpdateData),
                this._developerRepository.update(userId, developerUpdateData)
            ]);

            if (!updatedUser || !updatedDeveloper) {
                throw new AppError('Failed to update profile', StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                contact: updatedUser.contact,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                profilePicture: profilePictureUrl,
                socialLinks: updatedUser.socialLinks,
                hourlyRate: updatedDeveloper.hourlyRate,
                education: updatedDeveloper.education,
                languages: updatedDeveloper.languages,
                workingExperience: updatedDeveloper.workingExperience,
                resume: resumeUrl,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            };
        } catch (error: any) {
            if (profilePictureKey) {
                await this._s3Service.deleteFile(profilePictureKey);
            }
            if (resumeKey) {
                await this._s3Service.deleteFile(resumeKey);
            }
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                error.message || 'Error updating profile',
                error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
}


