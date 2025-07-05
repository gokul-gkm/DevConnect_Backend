import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { AppError } from '@/domain/errors/AppError';

export class GetUserProfileUseCase {
    constructor(
        private userRepository: UserRepository,
        private s3Service: S3Service
    ) {}

    async execute(userId: string) {
        try {
            const user = await this.userRepository.findById(userId);
            
            if (!user) {
                throw new AppError('User not found', 404);
            }

            let signedProfilePictureUrl = null;
            if (user.profilePicture) {
                signedProfilePictureUrl = await this.s3Service.generateSignedUrl(user.profilePicture);
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
                error.statusCode || 501
            );
        }
    }
}



