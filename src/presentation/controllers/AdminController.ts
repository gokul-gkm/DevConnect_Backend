import { Request, Response } from 'express';
import { DevQueryParams, QueryParams } from '@/domain/types/types';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { HTTP_STATUS_MESSAGES } from '@/utils/constants';

import { IAdminRepository } from '@/domain/interfaces/IAdminRepository';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { IMailService } from '@/domain/interfaces/IMailService';

import {AdminLoginUseCase} from '@/application/useCases/implements/admin/auth/AdminLoginUseCase';
import { GetUsersUseCase } from '@/application/useCases/implements/admin/users/GetUsersUseCase';
import { ToggleUserStatusUseCase } from '@/application/useCases/implements/admin/users/ToggleUserStatusUseCase';
import { GetUserDetailsUseCase } from '@/application/useCases/implements/admin/users/GetUserDetailsUseCase';
import { GetDevelopersUseCase } from '@/application/useCases/implements/admin/developers/GetDevelopersUseCase';
import { ManageDeveloperRequestsUseCase } from '@/application/useCases/implements/admin/developers/ManageDeveloperRequestsUseCase';
import { GetDeveloperDetailsUseCase } from '@/application/useCases/implements/admin/developers/GetDeveloperDetailsUseCase';
import { GetDeveloperRequestDetailsUseCase } from '@/application/useCases/implements/admin/developers/GetDeveloperRequestDetails';
import { GetDashboardStatsUseCase } from '@/application/useCases/implements/admin/dashboard/GetDashboardStatsUseCase';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { GetRevenueStatsUseCase } from '@/application/useCases/implements/admin/revenue/GetRevenueStatsUseCase';
import { GetAdminSessionsUseCase } from '@/application/useCases/implements/admin/sessions/GetAdminSessionsUseCase';
import { GetDeveloperLeaderboardUseCase } from '@/application/useCases/implements/admin/leaderboard/GetDeveloperLeaderboardUseCase';

import { IAdminLoginUseCase } from '@/application/useCases/interfaces/admin/auth/IAdminLoginUseCase';
import { IGetUsersUseCase } from '@/application/useCases/interfaces/admin/users/IGetUsersUseCase';
import { IToggleUserStatusUseCase } from '@/application/useCases/interfaces/admin/users/IToggleUserStatusUseCase';
import { IGetUserDetailsUseCase } from '@/application/useCases/interfaces/admin/users/IGetUserDetailsUseCase';
import { IGetDevelopersUseCase } from '@/application/useCases/interfaces/admin/developers/IGetDevelopersUseCase';
import { IManageDeveloperRequestsUseCase } from '@/application/useCases/interfaces/admin/developers/IManageDeveloperRequestsUseCase';
import { IGetDeveloperDetailsUseCase } from '@/application/useCases/interfaces/admin/developers/IGetDeveloperDetailsUseCase';
import { IGetDeveloperRequestDetailsUseCase } from '@/application/useCases/interfaces/admin/developers/IGetDeveloperRequestDetailsUseCase';
import { IGetDashboardStatsUseCase } from '@/application/useCases/interfaces/admin/dashboard/IGetDashboardStatsUseCase';
import { IGetRevenueStatsUseCase } from '@/application/useCases/interfaces/admin/revenue/IGetRevenueStatsUseCase';
import { IGetAdminSessionsUseCase } from '@/application/useCases/interfaces/admin/sessions/IGetAdminSessionsUseCase';
import { IGetDeveloperLeaderboardUseCase } from '@/application/useCases/interfaces/admin/leaderboard/IGetDeveloperLeaderboardUseCase';


export class AdminController{
    private _adminLoginUseCase: IAdminLoginUseCase;
    private _getUsersUseCase: IGetUsersUseCase;
    private _toggleUserStatusUseCase: IToggleUserStatusUseCase;
    private _getUserDetailsUseCase: IGetUserDetailsUseCase;
    private _getDeveloperUseCase: IGetDevelopersUseCase;
    private _manageDeveloperRequestsUseCase: IManageDeveloperRequestsUseCase;
    private _getDeveloperDetailsUseCase: IGetDeveloperDetailsUseCase;
    private _getDeveloperRequestDetailsUseCase: IGetDeveloperRequestDetailsUseCase;
    private _getDashboardStatsUseCase: IGetDashboardStatsUseCase;
    private _getRevenueStatsUseCase: IGetRevenueStatsUseCase;
    private _getAdminSessionsUseCase: IGetAdminSessionsUseCase;
    private _getDeveloperLeaderboardUseCase: IGetDeveloperLeaderboardUseCase;
    constructor(
        private _adminRepository: IAdminRepository,
        private _userRepository: IUserRepository,
        private _developerRepository: IDeveloperRepository,
        private _s3Service: S3Service,
        private _walletRepository: IWalletRepository,
        private _sessionRepository: ISessionRepository,
        private _mailService: IMailService
    ) {
        this._adminLoginUseCase = new AdminLoginUseCase(_adminRepository);
        this._getUsersUseCase = new GetUsersUseCase(_userRepository,_s3Service);
        this._toggleUserStatusUseCase = new ToggleUserStatusUseCase(_userRepository);
        this._getUserDetailsUseCase = new GetUserDetailsUseCase(_userRepository,_s3Service);
        this._getDeveloperUseCase = new GetDevelopersUseCase(_developerRepository,_s3Service)
        this._manageDeveloperRequestsUseCase = new ManageDeveloperRequestsUseCase(_developerRepository, _walletRepository,_s3Service, _mailService)
        this._getDeveloperDetailsUseCase = new GetDeveloperDetailsUseCase(_developerRepository,_s3Service)
        this._getDeveloperRequestDetailsUseCase = new GetDeveloperRequestDetailsUseCase(_developerRepository, _s3Service);
        this._getDashboardStatsUseCase = new GetDashboardStatsUseCase(_userRepository, _developerRepository, _sessionRepository, _walletRepository, _s3Service)
        this._getRevenueStatsUseCase = new GetRevenueStatsUseCase( _walletRepository, _sessionRepository, _s3Service);
        this._getAdminSessionsUseCase = new GetAdminSessionsUseCase(_sessionRepository, _s3Service);
        this._getDeveloperLeaderboardUseCase = new GetDeveloperLeaderboardUseCase(_developerRepository, _s3Service);
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken, admin } = await this._adminLoginUseCase.execute({ email, password });

            res.cookie('adminAccessToken', accessToken, {
                httpOnly: true,
                maxAge: 15 * 60 * 1000,
                sameSite: 'none',
                secure: true,
                path: '/'
            });
            res.cookie('adminRefreshToken', refreshToken, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'none',
                secure: true,
                path: '/'
            });

            return res.status(StatusCodes.OK).json({ message: 'Admin Login successful', admin, success: true });
        } catch (error) {
            if(error instanceof Error) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message, success: false });
            }
        }
    }

    async logout(req: Request, res: Response) {
        try {
            res.clearCookie('adminAccessToken');
            res.clearCookie('adminRefreshToken');
            return res.status(StatusCodes.OK).json({ message: 'Admin Logout successfully', success: true });
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false });
        }
    }

    async getUsers(req: Request, res: Response) {
        try {

            const queryParams: QueryParams = {
                page: Math.max(1, parseInt(req.query.page as string) || 1),
                limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10)),
                search: req.query.search as string,
                sortBy: req.query.sortBy as string,
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
            }

            const allowedSortFields = ['username', 'email', 'createdAt'];
            if (queryParams.sortBy && !allowedSortFields.includes(queryParams.sortBy)) {
                queryParams.sortBy = 'createdAt'
            }
            const users = await this._getUsersUseCase.execute(queryParams);

            return res.status(StatusCodes.OK).json({ success: true, ...users });
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error Fetching Users', success: false });
        }
    }
    
    async toggleUserStatus(req: Request, res: Response) { 
        try {
            const userId = req.params.id;
            const response = await this._toggleUserStatusUseCase.execute(userId);
            return res.status(StatusCodes.OK).json({ message: "User Status Updated Successfully", success: true });
        } catch (error: any) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message, success: false });
        }
    }

    async getUserDetails(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const user = await this._getUserDetailsUseCase.execute(userId);
            return res.status(StatusCodes.OK).json({user, success: true})
        } catch (error: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, success: false})
        }
    }

    async getAllDeveloper(req: Request, res: Response) {
        try {
        
            const queryParams: DevQueryParams = {
                page: Math.max(1, parseInt(req.query.page as string) || 1),
                limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10)),
                search: req.query.search as string,
                sortBy: req.query.sortBy as string,
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
                status: req.query.status as string
            }

            const result = await this._getDeveloperUseCase.execute(queryParams);
            return res.status(StatusCodes.OK).json({success: true, ...result})


            
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message ||HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async listRequests(req: Request, res: Response) {
        try {
            const queryParams = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                search: req.query.search as string,
                sortBy: req.query.sortBy as string,
                sortOrder: req.query.sortOrder as 'asc' | 'desc'
            };

            const result = await this._manageDeveloperRequestsUseCase.listRequests(queryParams);

            return res.status(StatusCodes.OK).json({
                success: true,
                ...result
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async approveRequest(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const developer = await this._manageDeveloperRequestsUseCase.approveRequest(id);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Developer request approved successfully',
                data: developer
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async rejectRequest(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const developer = await this._manageDeveloperRequestsUseCase.rejectRequest(id, reason);

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Developer request rejected successfully',
                data: developer
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async getDeveloperDetails(req: Request, res: Response) {
        try {
            const developerId = req.params.id;
            const developer = await this._getDeveloperDetailsUseCase.execute(developerId);
            
            return res.status(StatusCodes.OK).json({
                success: true,
                developer
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async getDeveloperRequestDetails(req: Request, res: Response) {
        try {
            const developerId = req.params.id;
            const developer = await this._getDeveloperRequestDetailsUseCase.execute(developerId);
            
            return res.status(StatusCodes.OK).json({
                success: true,
                developer
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async getDashboardStats(req: Request, res: Response): Promise<void> {
        try {
          const stats = await this._getDashboardStatsUseCase.execute();
          res.json(stats);
        } catch (error: any) {
          res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || 'Failed to fetch dashboard stats'
          });
        }
      }

    async getRevenueStats(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            const revenueStats = await this._getRevenueStatsUseCase.execute(page, limit);
            res.json(revenueStats);
        } catch (error: any) {
            res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message || 'Failed to fetch revenue stats'
            });
        }
    }

    async getAdminSessions(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = (req.query.status as string || '').split(',');
            const search = req.query.search as string || '';
            
            const sessions = await this._getAdminSessionsUseCase.execute(status, page, limit, search);
            res.json(sessions);
        } catch (error: any) {
            res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message || 'Failed to fetch sessions'
            });
        }
    }

    async getDeveloperLeaderboard(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortBy = (req.query.sortBy as string) || 'combined';
            
            const validSortOptions = ['combined', 'rating', 'earnings', 'sessions'];
            if (!validSortOptions.includes(sortBy)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid sort option. Must be one of: combined, rating, earnings, sessions'
                });
            }
            
            const result = await this._getDeveloperLeaderboardUseCase.execute(
                page,
                limit,
                sortBy
            );
            
            return res.status(StatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

}