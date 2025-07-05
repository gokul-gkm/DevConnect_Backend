import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES } from '@/utils/constants';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { IS3Service } from '@/domain/interfaces/IS3Service';
import { IGetDeveloperProfileUseCase } from '@/application/useCases/interfaces/developer/profile/IGetDeveloperProfileUseCase';


export class GetDeveloperProfileUseCase implements IGetDeveloperProfileUseCase {
    constructor(
        private _userRepository: IUserRepository,
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service
    ) { }

    async execute(userId: string) {
        try {
            const user = await this._userRepository.findById(userId);
            const developer = await this._developerRepository.findByUserId(userId);
            
            if (!user) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            let signedProfilePictureUrl = null;
            let signedResumeUrl = null;
            if (user.profilePicture) {
                signedProfilePictureUrl = await this._s3Service.generateSignedUrl(user.profilePicture);
            }

            if (developer?.resume) {
                signedResumeUrl = await this._s3Service.generateSignedUrl(developer.resume);
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