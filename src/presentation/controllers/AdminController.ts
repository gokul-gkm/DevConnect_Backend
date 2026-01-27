import { Request, Response } from 'express';
import { DevQueryParams, QueryParams } from '@/domain/types/types';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { HTTP_STATUS_MESSAGES } from '@/utils/constants';
import { inject } from 'inversify';
import { TYPES } from '@/types/types';
import { startOfDay, endOfDay } from 'date-fns';
import { IGetAdminSessionsReportUseCase } from '@/application/useCases/interfaces/admin/sessions/IGetAdminSessionsReportUseCase';

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
import { handleControllerError } from '../error/handleControllerError';
import { setCookie } from '@/utils/cookie.util';
import { getParamAsString } from '../utils/getParamAsString';
import { buildSessionReportCsv } from '../utils/sessionReport.util';

export class AdminController{

    constructor(
        @inject(TYPES.IAdminLoginUseCase)
        private _adminLoginUseCase: IAdminLoginUseCase,

        @inject(TYPES.IGetUsersUseCase)
        private _getUsersUseCase: IGetUsersUseCase,

        @inject(TYPES.IToggleUserStatusUseCase)
        private _toggleUserStatusUseCase: IToggleUserStatusUseCase,

        @inject(TYPES.IGetUserDetailsUseCase)
        private _getUserDetailsUseCase: IGetUserDetailsUseCase,

        @inject(TYPES.IGetDevelopersUseCase)
        private _getDeveloperUseCase: IGetDevelopersUseCase,

        @inject(TYPES.IManageDeveloperRequestsUseCase)
        private _manageDeveloperRequestsUseCase: IManageDeveloperRequestsUseCase,

        @inject(TYPES.IGetDeveloperDetailsUseCase)
        private _getDeveloperDetailsUseCase: IGetDeveloperDetailsUseCase,

        @inject(TYPES.IGetDeveloperRequestDetailsUseCase)
        private _getDeveloperRequestDetailsUseCase: IGetDeveloperRequestDetailsUseCase,

        @inject(TYPES.IGetDashboardStatsUseCase)
        private _getDashboardStatsUseCase: IGetDashboardStatsUseCase,

        @inject(TYPES.IGetRevenueStatsUseCase)
        private _getRevenueStatsUseCase: IGetRevenueStatsUseCase,

        @inject(TYPES.IGetAdminSessionsUseCase)
        private _getAdminSessionsUseCase: IGetAdminSessionsUseCase,

        @inject(TYPES.IGetDeveloperLeaderboardUseCase)
        private _getDeveloperLeaderboardUseCase: IGetDeveloperLeaderboardUseCase,

        @inject(TYPES.IGetAdminSessionsReportUseCase)
        private _getAdminSessionsReportUseCase: IGetAdminSessionsReportUseCase,
    ) {}

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken, admin } = await this._adminLoginUseCase.execute({ email, password });
            setCookie(res, "adminAccessToken",accessToken)
            setCookie(res, "adminRefreshToken", refreshToken)

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
        } catch (_error) {
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
        } catch (_error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error Fetching Users', success: false });
        }
    }
    
    async toggleUserStatus(req: Request, res: Response) { 
        try {

            const userId = getParamAsString(
                req.params.id,
                "userId"
            );
            await this._toggleUserStatusUseCase.execute(userId);
            return res.status(StatusCodes.OK).json({ message: "User Status Updated Successfully", success: true });
        } catch (error: unknown) {
            handleControllerError(error, res, HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserDetails(req: Request, res: Response) {
        try {
            const userId = getParamAsString(
                req.params.id,
                "userId"
            );
            const user = await this._getUserDetailsUseCase.execute(userId);
            return res.status(StatusCodes.OK).json({user, success: true})
        } catch (error: unknown) {
            handleControllerError(error, res, HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR);
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


            
        } catch (error: unknown) {
            handleControllerError(error, res, HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR);
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
            const id = getParamAsString(
                req.params.id,
                "id"
            );
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
            const id = getParamAsString(
                req.params.id,
                "id"
            );
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
            const developerId = getParamAsString(
                req.params.id,
                "developerId"
            );
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
            const developerId = getParamAsString(
                req.params.id,
                "developerId"
            );
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
        } catch (error: unknown) {
            handleControllerError(error, res, 'Failed to fetch dashboard stats');
        }
      }

    async getRevenueStats(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            const revenueStats = await this._getRevenueStatsUseCase.execute(page, limit);
            res.json(revenueStats);
        } catch (error: unknown) {
            handleControllerError(error, res, 'Failed to fetch revenue stats');
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
        } catch (error: unknown) {
            handleControllerError(error, res, 'Failed to fetch sessions');
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


    async downloadSessionsReport(req: Request, res: Response): Promise<void> {
        try {
          const statusParam = (req.query.status as string | undefined)?.split(',').filter(Boolean);
          const status = statusParam && statusParam.length > 0
            ? statusParam
            : ['pending','approved','rejected','scheduled','completed','active','cancelled','awaiting_payment'];
      
          const search = (req.query.search as string) || '';
          const from = req.query.from as string | undefined;
          const to = req.query.to as string | undefined;
          const fromDate = from ? startOfDay(new Date(from)) : undefined;
          const toDate = to ? endOfDay(new Date(to)) : undefined;
      
          const { sessions, totals } = await this._getAdminSessionsReportUseCase.execute({
            status,
            search,
            fromDate,
            toDate,
          });
      
          const csv = buildSessionReportCsv({
            sessions,
            totals,
            filters: { status, search, from, to },
          });
      
          const filename = `session-report-${new Date().toISOString()}.csv`;
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(csv);
        } catch (error: unknown) {
          handleControllerError(error, res, 'Failed to generate session report');
        }
      }
     
}

 
