import { DevRequestDTO } from "@/application/dto/DevRequestDTO";
import { AppError } from "@/domain/errors/AppError";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";

export class DevRequestUseCase {
    constructor(
        private userRepository: UserRepository,
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service
    ) {}

    async execute(data: DevRequestDTO, files: { 
        profilePicture?: Express.Multer.File[], 
        resume?: Express.Multer.File[] 
    }): Promise<void> {
        let profilePictureKey: string | undefined;
        let resumeKey: string | undefined;
        let profilePictureUrl: string | undefined;
        let resumeUrl: string | undefined;

        try {
            const existingUser = await this.userRepository.findByEmail(data.email);
            if (!existingUser) {
                throw new AppError('User not found', 404);
            }

            const existingDeveloper = await this.developerRepository.findByUserId(existingUser.id);
            if (existingDeveloper) {
                throw new AppError('Developer profile already exists', 400);
            }

            if (files.profilePicture && files.profilePicture[0]) {
                const uploadResult = await this.s3Service.uploadFile(files.profilePicture[0], 'profile-images');
                profilePictureKey = uploadResult.Key;
                profilePictureUrl = await this.s3Service.generateSignedUrl(profilePictureKey);
            }

            if (files.resume && files.resume[0]) {
                const uploadResult = await this.s3Service.uploadFile(files.resume[0], 'resumes');
                resumeKey = uploadResult.Key;
                resumeUrl = await this.s3Service.generateSignedUrl(resumeKey);
            }

            await this.userRepository.update(existingUser.id, {
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

            await this.developerRepository.createDeveloper({
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
                resume: resumeKey, // Store only the key in DB
            });
        } catch (error) {
            if (profilePictureKey) {
                await this.s3Service.deleteFile(profilePictureKey);
            }
            if (resumeKey) {
                await this.s3Service.deleteFile(resumeKey);
            }
            throw error;
        }
    }
}



