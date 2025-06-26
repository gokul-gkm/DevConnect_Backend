import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';
import { AppError } from "@/domain/errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from "@/utils/constants";

import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { IS3Service } from "@/domain/interfaces/IS3Service";

import { GetPublicProfileUseCase } from "@/application/useCases/implements/user/developers/GetPublicProfileUseCase";
import { SearchDevelopersUseCase } from "@/application/useCases/implements/user/developers/SearchDevelopersUseCase";
import { ChangeUserPasswordUseCase } from "@/application/useCases/implements/user/profile/ChangeUserPasswordUseCase";
import { GetUserProfileUseCase } from "@/application/useCases/implements/user/profile/GetUserProfileUseCase";
import { UpdateUserProfileUseCase } from "@/application/useCases/implements/user/profile/UpdateUserProfileUseCase";

import { IGetPublicProfileUseCase } from "@/application/useCases/interfaces/user/developers/IGetPublicProfileUseCase";
import { ISearchDevelopersUseCase } from "@/application/useCases/interfaces/user/developers/ISearchDevelopersUseCase";
import { IChangeUserPasswordUseCase } from "@/application/useCases/interfaces/user/profile/IChangeUserPasswordUseCase";
import { IGetUserProfileUseCase } from "@/application/useCases/interfaces/user/profile/IGetUserProfileUseCase";
import { IUpdateUserProfileUseCase } from "@/application/useCases/interfaces/user/profile/IUpdateUserProfileUseCase";


export class UserController {
    private _getUserProfileUseCase: IGetUserProfileUseCase;
    private _updateUserProfileUseCase: IUpdateUserProfileUseCase;
    private _searchDevelopersUseCase: ISearchDevelopersUseCase;
    private _getPublicProfileUseCase: IGetPublicProfileUseCase;
    private _changeUserPasswordUseCase: IChangeUserPasswordUseCase;
    constructor(
        private _userRepository: IUserRepository,
        private _developerRepository: IDeveloperRepository,
        private _s3Service: IS3Service,
    ) {
        this._getUserProfileUseCase = new GetUserProfileUseCase(_userRepository,_s3Service)
        this._updateUserProfileUseCase = new UpdateUserProfileUseCase(_userRepository, _s3Service);
        this._searchDevelopersUseCase = new SearchDevelopersUseCase(_developerRepository, _s3Service)
        this._getPublicProfileUseCase = new GetPublicProfileUseCase(_developerRepository, _s3Service);
        this._changeUserPasswordUseCase = new ChangeUserPasswordUseCase(_userRepository)
     }
    
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
            await this._changeUserPasswordUseCase.execute(userId,{ currentPassword, newPassword, confirmPassword });

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
            const profile = await this._getPublicProfileUseCase.execute(developerId);
    
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