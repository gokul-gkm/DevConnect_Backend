import { Request, Response } from 'express';
import {AdminLoginUseCase} from '@/application/useCases/admin/auth/AdminLoginUseCase';
import { GetUsersUseCase } from '@/application/useCases/admin/users/GetUsersUseCase';
import { ToggleUserStatusUseCase } from '@/application/useCases/admin/users/ToggleUserStatusUseCase';
import { GetUserDetailsUseCase } from '@/application/useCases/admin/users/GetUserDetailsUseCase';
import { DevQueryParams, QueryParams } from '@/domain/types/types';
import { GetDevelopersUseCase } from '@/application/useCases/developer/GetDevelopersUseCase';
import { DeveloperRepository } from '@/infrastructure/repositories/DeveloperRepository';
import { AppError } from '@/domain/errors/AppError';
import { ManageDeveloperRequestsUseCase } from '@/application/useCases/developer/ManageDeveloperRequestsUseCase';
import { GetDeveloperDetailsUseCase } from '@/application/useCases/admin/developers/GetDeveloperDetailsUseCase';
import { GetDeveloperRequestDetailsUseCase } from '@/application/useCases/developer/GetDeveloperRequestDetails';
import { StatusCodes } from 'http-status-codes';
import { S3Service } from '@/infrastructure/services/S3_Service';
import { IAdminRepository } from '@/domain/interfaces/IAdminRepository';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';
import { GetDashboardStatsUseCase } from '@/application/useCases/admin/dashboard/GetDashboardStatsUseCase';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository';
import { IDeveloperRepository } from '@/domain/interfaces/IDeveloperRepository';
import { GetRevenueStatsUseCase } from '@/application/useCases/admin/revenue/GetRevenueStatsUseCase';
import { GetAdminSessionsUseCase } from '@/application/useCases/admin/sessions/GetAdminSessionsUseCase';
import { GetDeveloperLeaderboardUseCase } from '@/application/useCases/admin/leaderboard/GetDeveloperLeaderboardUseCase';
import { HTTP_STATUS_MESSAGES } from '@/utils/constants';


export class AdminController{
    private adminLoginUseCase: AdminLoginUseCase;
    private getUsersUseCase: GetUsersUseCase;
    private toggleUserStatusUseCase: ToggleUserStatusUseCase;
    private getUserDetailsUseCase: GetUserDetailsUseCase;
    private getDeveloperUseCase: GetDevelopersUseCase;
    private manageDeveloperRequestsUseCase: ManageDeveloperRequestsUseCase;
    private getDeveloperDetailsUseCase: GetDeveloperDetailsUseCase;
    private getDeveloperRequestDetailsUseCase: GetDeveloperRequestDetailsUseCase;
    private getDashboardStatsUseCase: GetDashboardStatsUseCase;
    private getRevenueStatsUseCase: GetRevenueStatsUseCase;
    private getAdminSessionsUseCase: GetAdminSessionsUseCase;
    private getDeveloperLeaderboardUseCase: GetDeveloperLeaderboardUseCase;
    constructor(
        private adminRepository: IAdminRepository,
        private userRepository: IUserRepository,
        private developerRepository: DeveloperRepository,
        private s3Service: S3Service,
        private walletRepository: IWalletRepository,
        private sessionRepository: ISessionRepository
    ) {
        this.adminLoginUseCase = new AdminLoginUseCase(adminRepository);
        this.getUsersUseCase = new GetUsersUseCase(userRepository,s3Service);
        this.toggleUserStatusUseCase = new ToggleUserStatusUseCase(userRepository);
        this.getUserDetailsUseCase = new GetUserDetailsUseCase(userRepository,s3Service);
        this.getDeveloperUseCase = new GetDevelopersUseCase(developerRepository,s3Service)
        this.manageDeveloperRequestsUseCase = new ManageDeveloperRequestsUseCase(developerRepository, walletRepository,s3Service)
        this.getDeveloperDetailsUseCase = new GetDeveloperDetailsUseCase(developerRepository,s3Service)
        this.getDeveloperRequestDetailsUseCase = new GetDeveloperRequestDetailsUseCase(developerRepository, s3Service);
        this.getDashboardStatsUseCase = new GetDashboardStatsUseCase(userRepository, developerRepository, sessionRepository, walletRepository, s3Service)
        this.getRevenueStatsUseCase = new GetRevenueStatsUseCase(
            walletRepository, 
            sessionRepository,
            s3Service
        );
        this.getAdminSessionsUseCase = new GetAdminSessionsUseCase(sessionRepository, s3Service);
        this.getDeveloperLeaderboardUseCase = new GetDeveloperLeaderboardUseCase(developerRepository, s3Service);
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken, admin } = await this.adminLoginUseCase.execute({ email, password });

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
            const users = await this.getUsersUseCase.execute(queryParams);

            return res.status(StatusCodes.OK).json({ success: true, ...users });
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error Fetching Users', success: false });
        }
    }
    
    async toggleUserStatus(req: Request, res: Response) { 
        try {
            const userId = req.params.id;
            const response = await this.toggleUserStatusUseCase.execute(userId);
            return res.status(StatusCodes.OK).json({ message: "User Status Updated Successfully", success: true });
        } catch (error: any) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message, success: false });
        }
    }

    async getUserDetails(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const user = await this.getUserDetailsUseCase.execute(userId);
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

            const result = await this.getDeveloperUseCase.execute(queryParams);
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

            const result = await this.manageDeveloperRequestsUseCase.listRequests(queryParams);

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
            const developer = await this.manageDeveloperRequestsUseCase.approveRequest(id);

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

            const developer = await this.manageDeveloperRequestsUseCase.rejectRequest(id, reason);

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
            const developer = await this.getDeveloperDetailsUseCase.execute(developerId);
            
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
            const developer = await this.getDeveloperRequestDetailsUseCase.execute(developerId);
            
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
          const stats = await this.getDashboardStatsUseCase.execute();
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
            
            const revenueStats = await this.getRevenueStatsUseCase.execute(page, limit);
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
            
            const sessions = await this.getAdminSessionsUseCase.execute(status, page, limit, search);
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
            
            const result = await this.getDeveloperLeaderboardUseCase.execute(
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