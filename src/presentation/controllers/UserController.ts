import { GetPublicProfileUseCase } from "@/application/useCases/user/developers/GetPublicProfileUseCase";
import { SearchDevelopersUseCase } from "@/application/useCases/user/developers/SearchDevelopersUseCase";
import { ChangeUserPasswordUseCase } from "@/application/useCases/user/profile/ChangeUserPasswordUseCase";
import { GetUserProfileUseCase } from "@/application/useCases/user/profile/GetUserProfileUseCase";
import { UpdateUserProfileUseCase } from "@/application/useCases/user/profile/UpdateUserProfileUseCase";
import { AppError } from "@/domain/errors/AppError";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from "@/utils/constants";
import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';

export class UserController {
    private getUserProfileUseCase: GetUserProfileUseCase;
    private updateUserProfileUseCase: UpdateUserProfileUseCase;
    private searchDevelopersUseCase: SearchDevelopersUseCase;
    private getPublicProfileUseCase: GetPublicProfileUseCase;
    private changeUserPasswordUseCase: ChangeUserPasswordUseCase;
    constructor(
        private userRepository: UserRepository,
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service,
    ) {
        this.getUserProfileUseCase = new GetUserProfileUseCase(userRepository,s3Service)
        this.updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository, s3Service);
        this.searchDevelopersUseCase = new SearchDevelopersUseCase(developerRepository, s3Service)
        this.getPublicProfileUseCase = new GetPublicProfileUseCase(developerRepository, s3Service);
        this.changeUserPasswordUseCase = new ChangeUserPasswordUseCase(userRepository)
     }
    
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED,StatusCodes.BAD_REQUEST);
            }
            const user = await this.getUserProfileUseCase.execute(userId);
            if(!user) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND,StatusCodes.NOT_FOUND);
            }
            return res.status(StatusCodes.OK).json({data: user, success: true});
            
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({success: false, message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR});
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
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async changePassword (req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
            const { currentPassword, newPassword, confirmPassword } = req.body;
            await this.changeUserPasswordUseCase.execute(userId,{ currentPassword, newPassword, confirmPassword });

            return res.status(StatusCodes.OK).json({message: "Password has been updated successfully", success: true})
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failde to update password' });
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