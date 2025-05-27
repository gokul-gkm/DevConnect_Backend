import { IVideoSessionRepository } from "@/domain/interfaces/IVideoSessionRepository";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

export class EndVideoSessionUseCase {
    constructor(
        private videoSessionRepository: IVideoSessionRepository,
        private sessionRepository: ISessionRepository,
        private socketService: SocketService
    ) {}

    async execute(sessionId: string, developerId: string): Promise<any> {
        try {
            const videoSession = await this.videoSessionRepository.getVideoSessionBySessionId(
                new Types.ObjectId(sessionId)
            );

            if (!videoSession) {
                throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
            }

            if (videoSession.hostId.toString() !== developerId) {
                throw new AppError("Only host can end the session", StatusCodes.FORBIDDEN);
            }

            const updatedVideoSession = await this.videoSessionRepository.endVideoSession(
                new Types.ObjectId(sessionId)
            );

            await this.sessionRepository.updateSessionStatus(
                new Types.ObjectId(sessionId),
                'completed'
            );

            this.socketService.emitToUser(videoSession.participantId.toString(), 'video:session:ended', {
                sessionId
            });

            return updatedVideoSession;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to end video session", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
