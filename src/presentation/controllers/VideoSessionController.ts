import { Request, Response } from 'express';
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';

import { IVideoSessionRepository } from '@/domain/interfaces/IVideoSessionRepository';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { ISocketService } from '@/domain/interfaces/ISocketService';
import { IWalletRepository } from '@/domain/interfaces/IWalletRepository';

import { InitVideoSessionUseCase } from '@/application/useCases/implements/video/InitVideoSessionUseCase';
import { JoinVideoSessionUseCase } from '@/application/useCases/implements/video/JoinVideoSessionUseCase';
import { EndVideoSessionUseCase } from '@/application/useCases/implements/video/EndVideoSessionUseCase'; 
import { LeaveVideoSessionUseCase } from '@/application/useCases/implements/video/LeaveVideoSessionUseCase';

import { IInitVideoSessionUseCase } from '@/application/useCases/interfaces/video/IInitVideoSessionUseCase';
import { IJoinVideoSessionUseCase } from '@/application/useCases/interfaces/video/IJoinVideoSessionUseCase';
import { IEndVideoSessionUseCase } from '@/application/useCases/interfaces/video/IEndVideoSessionUseCase';
import { ILeaveVideoSessionUseCase } from '@/application/useCases/interfaces/video/ILeaveVideoSessionUseCase';

export class VideoSessionController {
    private _initVideoSessionUseCase: IInitVideoSessionUseCase;
    private _joinVideoSessionUseCase: IJoinVideoSessionUseCase;
    private _endVideoSessionUseCase: IEndVideoSessionUseCase;
    private _leaveVideoSessionUseCase: ILeaveVideoSessionUseCase;

    constructor(
        private _videoSessionRepository: IVideoSessionRepository,
        private _sessionRepository: ISessionRepository,
        private _socketService: ISocketService,
        private _walletRepository: IWalletRepository
    ) {
        this._initVideoSessionUseCase = new InitVideoSessionUseCase(
            _videoSessionRepository,
            _sessionRepository,
            _socketService
        );
        this._joinVideoSessionUseCase = new JoinVideoSessionUseCase(
            _videoSessionRepository,
            _socketService
        );
        this._endVideoSessionUseCase = new EndVideoSessionUseCase(
            _videoSessionRepository,
            _sessionRepository,
            _socketService,
            _walletRepository
        );
        this._leaveVideoSessionUseCase = new LeaveVideoSessionUseCase(
            _videoSessionRepository,
            _socketService
        );
    }

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
            const videoSession = await this._videoSessionRepository.getVideoSessionBySessionId(
                new Types.ObjectId(sessionId)
            );

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
            const videoSession = await this._videoSessionRepository.getVideoSessionBySessionId(
                new Types.ObjectId(sessionId)
            );

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
