import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { IGetUserProfileUseCase } from '@/application/useCases/interfaces/user/profile/IGetUserProfileUseCase';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

@injectable()
export class GetUserProfileUseCase implements IGetUserProfileUseCase{
    constructor(
        @inject(TYPES.IUserRepository)
        private _userRepository: IUserRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) {}

    async execute(userId: string) {
        try {
            const user = await this._userRepository.findById(userId);
            
            if (!user) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            let signedProfilePictureUrl = null;
            if (user.profilePicture) {
                signedProfilePictureUrl = await this._s3Service.generateSignedUrl(user.profilePicture);
            }

            return {
                id: user._id,
                username: user.username,
                email: user.email,
                contact: user.contact,
                location: user.location,
                bio: user.bio,
                profilePicture: signedProfilePictureUrl,
                skills: user.skills,
                socialLinks: user.socialLinks,
                createdAt: user.createdAt
            };
        } catch (error: any) {
            throw new AppError(
                error.message || 'Error fetching profile',
                error.statusCode || StatusCodes.NOT_IMPLEMENTED
            );
        }
    }
}



