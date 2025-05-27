


import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { ProfileUpdateData } from '@/domain/types/types';
import { ERROR_MESSAGES } from '@/utils/constants';

export class UpdateUserProfileUseCase {
    constructor(
        private userRepository: UserRepository,
        private s3Service: S3Service
    ) {}

    async execute(userId: string, profileData: ProfileUpdateData, files: { profilePicture?: Express.Multer.File[] }) {
        try {
            const existingUser = await this.userRepository.findById(userId);
            if (!existingUser) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            let profilePictureKey = existingUser.profilePicture;

            if (files.profilePicture && files.profilePicture[0]) {
                if (existingUser.profilePicture) {
                    try {
                        await this.s3Service.deleteFile(existingUser.profilePicture);
                    } catch (error) {
                        console.error('Error deleting old profile picture:', error);
                    }
                }

                const profilePictureResult = await this.s3Service.uploadFile(
                    files.profilePicture[0],
                    'profile-images'
                );
                profilePictureKey = profilePictureResult.Key;
            }

            const updatedUser = await this.userRepository.update(userId, {
                ...profileData,
                profilePicture: profilePictureKey
            });

            if (!updatedUser) {
                throw new AppError('Failed to update profile', StatusCodes.INTERNAL_SERVER_ERROR);
            }

            const signedProfilePictureUrl = updatedUser.profilePicture
                ? await this.s3Service.generateSignedUrl(updatedUser.profilePicture)
                : null;
            

            return {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                contact: updatedUser.contact,
                location: updatedUser.location,
                bio: updatedUser.bio,
                profilePicture: signedProfilePictureUrl,
                skills: updatedUser.skills,
                socialLinks: updatedUser.socialLinks,
                memberSince: updatedUser.createdAt
            };
        } catch (error: any) {
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
