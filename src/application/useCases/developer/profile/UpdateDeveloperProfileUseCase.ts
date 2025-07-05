import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { S3Service } from "@/infrastructure/services/S3_Service";
import { ProfileUpdateData } from '@/domain/types/developer';
import { DeveloperRepository } from '@/infrastructure/repositories/DeveloperRepository';

export class UpdateDeveloperProfileUseCase {
    constructor(
        private userRepository: UserRepository,
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
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
            const existingUser = await this.userRepository.findById(userId);
            const existingDeveloper = await this.developerRepository.findByUserId(userId);

            if (!existingUser || !existingDeveloper) {
                throw new AppError('Developer not found', StatusCodes.NOT_FOUND);
            }

            if (files.profilePicture?.[0]) {
                if (existingUser.profilePicture) {
                    try {
                        await this.s3Service.deleteFile(existingUser.profilePicture);
                    } catch (error) {
                        console.error('Error deleting old profile picture');
                    }
                }
                const uploadResult = await this.s3Service.uploadFile(files.profilePicture[0], 'profile-images');
                profilePictureKey = uploadResult.Key;
                profilePictureUrl = await this.s3Service.generateSignedUrl(profilePictureKey);
            }

            if (files.resume?.[0]) {
                if (existingDeveloper.resume) {
                    try {
                        await this.s3Service.deleteFile(existingDeveloper.resume);
                    } catch (error) {
                        console.error('Error deleting old resume');
                    }
                }
                const uploadResult = await this.s3Service.uploadFile(files.resume[0], 'resumes');
                resumeKey = uploadResult.Key;
                resumeUrl = await this.s3Service.generateSignedUrl(resumeKey);
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

            console.log("skills : ", profileData.skills);

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

            console.log("dev up data : ", developerUpdateData)

            const [updatedUser, updatedDeveloper] = await Promise.all([
                this.userRepository.update(userId, userUpdateData),
                this.developerRepository.update(userId, developerUpdateData)
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
                await this.s3Service.deleteFile(profilePictureKey);
            }
            if (resumeKey) {
                await this.s3Service.deleteFile(resumeKey);
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


