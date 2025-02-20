import { GetPublicProfileUseCase } from "@/application/useCases/user/developers/GetPublicProfileUseCase";
import { SearchDevelopersUseCase } from "@/application/useCases/user/developers/SearchDevelopersUseCase";
import { GetUserProfileUseCase } from "@/application/useCases/user/profile/GetUserProfileUseCase";
import { UpdateUserProfileUseCase } from "@/application/useCases/user/profile/UpdateUserProfileUseCase";
import { AppError } from "@/domain/errors/AppError";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';

export class UserController {
    private getUserProfileUseCase: GetUserProfileUseCase;
    private updateUserProfileUseCase: UpdateUserProfileUseCase;
    private searchDevelopersUseCase: SearchDevelopersUseCase;
    private getPublicProfileUseCase: GetPublicProfileUseCase;
    constructor(
        private userRepository: UserRepository,
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service,
    ) {
        this.getUserProfileUseCase = new GetUserProfileUseCase(userRepository,s3Service)
        this.updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository, s3Service);
        this.searchDevelopersUseCase = new SearchDevelopersUseCase(developerRepository, s3Service)
        this.getPublicProfileUseCase = new GetPublicProfileUseCase(developerRepository,s3Service)
     }
    
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User ID is required",400);
            }
            const user = await this.getUserProfileUseCase.execute(userId);
            if(!user) {
                throw new AppError("User not found",404);
            }
            return res.status(StatusCodes.OK).json({data: user, success: true});
            
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: 'Internal server error'});
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
    
            const profileData = req.body;

            const parsedData = {
                ...profileData,
                skills: JSON.parse(profileData.skills),
                socialLinks: JSON.parse(profileData.socialLinks)
            };

            const updatedUser = await this.updateUserProfileUseCase.execute(
                userId,
                parsedData,
                { profilePicture: req.file ? [req.file] : undefined }
            );
    
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Profile updated ',
                data: updatedUser
            });
        } catch (error: any) {
            console.error("Update profile error:", error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: true,
                message: 'Internal server error'
            });
        }
    }

    async searchDevelopers(req: Request, res: Response) {
        try {
            const searchParams = req.query;
            const result = await this.searchDevelopersUseCase.execute(searchParams);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to search developers'
            });
        }
    }

    async getPublicProfile(req: Request, res: Response) {
        try {
            const { developerId } = req.params;
            const profile = await this.getPublicProfileUseCase.execute(developerId);
    
            return res.status(StatusCodes.OK).json({
                success: true,
                data: profile
            });
        } catch (error: any) {
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to fetch developer profile'
            });
        }
    }
}