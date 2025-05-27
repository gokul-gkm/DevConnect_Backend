import { Request, Response } from 'express';
import { IVideoSessionRepository } from '@/domain/interfaces/IVideoSessionRepository';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { SocketService } from '@/infrastructure/services/SocketService';
import { InitVideoSessionUseCase } from '@/application/useCases/video/InitVideoSessionUseCase';
import { JoinVideoSessionUseCase } from '@/application/useCases/video/JoinVideoSessionUseCase';
import { EndVideoSessionUseCase } from '@/application/useCases/video/EndVideoSessionUseCase'; 
import { AppError } from '@/domain/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from '@/utils/constants';

export class VideoSessionController {
    private initVideoSessionUseCase: InitVideoSessionUseCase;
    private joinVideoSessionUseCase: JoinVideoSessionUseCase;
    private endVideoSessionUseCase: EndVideoSessionUseCase;

    constructor(
        private videoSessionRepository: IVideoSessionRepository,
        private sessionRepository: ISessionRepository,
        private socketService: SocketService
    ) {
        this.initVideoSessionUseCase = new InitVideoSessionUseCase(
            videoSessionRepository,
            sessionRepository,
            socketService
        );
        this.joinVideoSessionUseCase = new JoinVideoSessionUseCase(
            videoSessionRepository,
            socketService
        );
        this.endVideoSessionUseCase = new EndVideoSessionUseCase(
            videoSessionRepository,
            sessionRepository,
            socketService
        );
    }

    async initVideoSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const developerId = req.userId;

            if (!developerId) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED, StatusCodes.UNAUTHORIZED);
            }

            const videoSession = await this.initVideoSessionUseCase.execute(sessionId, developerId);
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

            const videoSession = await this.joinVideoSessionUseCase.execute(sessionId, userId, isHost);
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

            const videoSession = await this.endVideoSessionUseCase.execute(sessionId, developerId);
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
            const videoSession = await this.videoSessionRepository.getVideoSessionBySessionId(
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
            const videoSession = await this.videoSessionRepository.getVideoSessionBySessionId(
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
}
