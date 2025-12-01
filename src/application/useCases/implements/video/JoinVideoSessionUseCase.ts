import { IVideoSessionRepository } from "@/domain/interfaces/repositories/IVideoSessionRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ISocketService } from "@/domain/interfaces/services/ISocketService";
import { IJoinVideoSessionUseCase } from "../../interfaces/video/IJoinVideoSessionUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class JoinVideoSessionUseCase implements IJoinVideoSessionUseCase {
    constructor(
        @inject(TYPES.IVideoSessionRepository)
        private _videoSessionRepository: IVideoSessionRepository,
        @inject(TYPES.ISocketService)
        private _socketService: ISocketService
    ) {}

    async execute(sessionId: string, userId: string, isHost: boolean): Promise<any> {
        try {
            const videoSession = await this._videoSessionRepository.getVideoSessionBySessionId(
                new Types.ObjectId(sessionId)
            );


            if (!videoSession) {
                throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
            }

            if (videoSession.status !== 'active') {
                throw new AppError("Video session is not active", StatusCodes.BAD_REQUEST);
            }

            const updatedSession = isHost ? 
                await this._videoSessionRepository.updateHostJoinedAt(new Types.ObjectId(sessionId)) :
                await this._videoSessionRepository.updateParticipantJoinedAt(new Types.ObjectId(sessionId));

            const otherParticipantId = isHost ? 
                videoSession.participantId.toString() : 
                videoSession.hostId.toString();
            
            this._socketService.emitToUser(otherParticipantId, 'video:session:participant_joined', {
                sessionId,
                userId
            });

            return updatedSession;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to join video session", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
