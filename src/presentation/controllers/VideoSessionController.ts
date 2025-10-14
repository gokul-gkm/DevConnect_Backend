import { Request, Response } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/types';

import { IInitVideoSessionUseCase } from '@/application/useCases/interfaces/video/IInitVideoSessionUseCase';
import { IJoinVideoSessionUseCase } from '@/application/useCases/interfaces/video/IJoinVideoSessionUseCase';
import { IEndVideoSessionUseCase } from '@/application/useCases/interfaces/video/IEndVideoSessionUseCase';
import { ILeaveVideoSessionUseCase } from '@/application/useCases/interfaces/video/ILeaveVideoSessionUseCase';
import { IGetVideoSessionUseCase } from '@/application/useCases/interfaces/video/IGetVideoSessionUseCase';

@injectable()
export class VideoSessionController {

    constructor(
        @inject(TYPES.IInitVideoSessionUseCase)
        private _initVideoSessionUseCase: IInitVideoSessionUseCase,

        @inject(TYPES.IJoinVideoSessionUseCase)
        private _joinVideoSessionUseCase: IJoinVideoSessionUseCase,

        @inject(TYPES.IEndVideoSessionUseCase)
        private _endVideoSessionUseCase: IEndVideoSessionUseCase,

        @inject(TYPES.ILeaveVideoSessionUseCase)
        private _leaveVideoSessionUseCase: ILeaveVideoSessionUseCase,

        @inject(TYPES.IGetVideoSessionUseCase)
        private _getVideoSessionUseCase: IGetVideoSessionUseCase
    ) {}

    async initVideoSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const developerId = req.userId;

            if (!developerId) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.UNAUTHORIZED);
            }

            const videoSession = await this._initVideoSessionUseCase.execute(sessionId, developerId);
            return res.status(StatusCodes.OK).json({ data: videoSession, success: true });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, 
                success: false 
            });
        }
    }

    async joinVideoSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const userId = req.userId;
            const { isHost } = req.body;

            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.UNAUTHORIZED);
            }

            const videoSession = await this._joinVideoSessionUseCase.execute(sessionId, userId, isHost);
            return res.status(StatusCodes.OK).json({ data: videoSession, success: true });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, 
                success: false 
            });
        }
    }

    async endVideoSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const developerId = req.userId;

            if (!developerId) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.UNAUTHORIZED);
            }

            const videoSession = await this._endVideoSessionUseCase.execute(sessionId, developerId);
            return res.status(StatusCodes.OK).json({ data: videoSession, success: true });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, 
                success: false 
            });
        }
    }

    async getVideoSessionDetails(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;

            const videoSession = await this._getVideoSessionUseCase.execute(sessionId);

            if (!videoSession) {
                throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
            }

            return res.status(StatusCodes.OK).json({ data: videoSession, success: true });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, 
                success: false 
            });
        }
    }

    async getVideoSessionStatus(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;

            const videoSession = await this._getVideoSessionUseCase.execute(sessionId);

            if (!videoSession) {
                return res.status(StatusCodes.OK).json({ 
                    data: { status: 'inactive' }, 
                    success: true 
                });
            }

            return res.status(StatusCodes.OK).json({ 
                data: { status: videoSession.status }, 
                success: true 
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, 
                success: false 
            });
        }
    }

    async leaveVideoSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const userId = req.userId;

            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.UNAUTHORIZED);
            }

            await this._leaveVideoSessionUseCase.execute(sessionId, userId);
            return res.status(StatusCodes.OK).json({ success: true });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message, success: false });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR, 
                success: false 
            });
        }
    }
}
