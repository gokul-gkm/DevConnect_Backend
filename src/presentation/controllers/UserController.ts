import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';
import { AppError } from "@/domain/errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from "@/utils/constants";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

import { IGetPublicProfileUseCase } from "@/application/useCases/interfaces/user/developers/IGetPublicProfileUseCase";
import { ISearchDevelopersUseCase } from "@/application/useCases/interfaces/user/developers/ISearchDevelopersUseCase";
import { IGetUserProfileUseCase } from "@/application/useCases/interfaces/user/profile/IGetUserProfileUseCase";
import { IUpdateUserProfileUseCase } from "@/application/useCases/interfaces/user/profile/IUpdateUserProfileUseCase";
import { IChangePasswordUseCase } from "@/application/useCases/interfaces/shared/profile/IChangePasswordUseCase";


@injectable()
export class UserController {

     constructor(
        @inject(TYPES.IGetUserProfileUseCase)
        private _getUserProfileUseCase: IGetUserProfileUseCase,
        @inject(TYPES.IUpdateUserProfileUseCase)
        private _updateUserProfileUseCase: IUpdateUserProfileUseCase,
        @inject(TYPES.ISearchDevelopersUseCase)
        private _searchDevelopersUseCase: ISearchDevelopersUseCase,
        @inject(TYPES.IGetPublicProfileUseCase)
        private _getPublicProfileUseCase: IGetPublicProfileUseCase,
        @inject(TYPES.IChangePasswordUseCase)
        private _changePasswordUseCase: IChangePasswordUseCase,
      ) {}
    

    
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED,StatusCodes.BAD_REQUEST);
            }
            const user = await this._getUserProfileUseCase.execute(userId);
            if(!user) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND,StatusCodes.NOT_FOUND);
            }
            return res.status(StatusCodes.OK).json({data: user, success: true});
            
        } catch (error) {
            console.error("Get profile error:", error);
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

            const updatedUser = await this._updateUserProfileUseCase.execute(
                userId,
                parsedData,
                { profilePicture: req.file ? [req.file] : undefined }
            );
    
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Profile updated ',
                data: updatedUser
            });
        } catch (error: unknown) {
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
            await this._changePasswordUseCase.execute(userId,{ currentPassword, newPassword, confirmPassword });

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
            const result = await this._searchDevelopersUseCase.execute(searchParams);

            return res.status(StatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error: unknown) {
            const message = error instanceof AppError ? error.message : 'Failed to search developers';
            const statusCode = error instanceof AppError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
            return res.status(statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: message || 'Failed to search developers' 
            });
        }
    }

    async getPublicProfile(req: Request, res: Response) {
        try {
            const { developerId } = req.params;
            const profile = await this._getPublicProfileUseCase.execute(developerId);
    
            return res.status(StatusCodes.OK).json({
                success: true,
                data: profile
            });
        } catch (error: unknown) {
            const message = error instanceof AppError ? error.message : 'Failed to fetch developer profile';
            const statusCode = error instanceof AppError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
            return res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
}