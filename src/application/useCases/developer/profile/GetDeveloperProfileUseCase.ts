import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { AppError } from '@/domain/errors/AppError';
import { DeveloperRepository } from '@/infrastructure/repositories/DeveloperRepository';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { StatusCodes } from 'http-status-codes';


export class GetDeveloperProfileUseCase {
    constructor(private userRepository: UserRepository, private developerRepository: DeveloperRepository, private s3Service: S3Service) {}

    async execute(userId: string) {
        try {
            const user = await this.userRepository.findById(userId);
            const developer = await this.developerRepository.findByUserId(userId);
            
            if (!user) {
                throw new AppError('User not found', StatusCodes.NOT_FOUND);
            }

            let signedProfilePictureUrl = null;
            let signedResumeUrl = null;
            if (user.profilePicture) {
                signedProfilePictureUrl = await this.s3Service.generateSignedUrl(user.profilePicture);
            }

            if (developer?.resume) {
                signedResumeUrl = await this.s3Service.generateSignedUrl(developer.resume);
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
                createdAt: user.createdAt,
                hourlyRate: developer?.hourlyRate,
                experience: developer?.workingExperience.experience,
                companyName: developer?.workingExperience.companyName,
                jobTitle: developer?.workingExperience.jobTitle,
                languages: developer?.languages,
                education: {
                    degree: developer?.education.degree,
                    institution: developer?.education.institution,
                    year: developer?.education.year
                },
                resume: signedResumeUrl
                            
            };
        } catch (error: any) {
            throw new AppError(
                error.message || 'Error fetching profile',
                error.statusCode || StatusCodes.NOT_IMPLEMENTED
            );
        }
    }
}