import { IVideoSessionRepository } from "@/domain/interfaces/IVideoSessionRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

export class JoinVideoSessionUseCase {
    constructor(
        private videoSessionRepository: IVideoSessionRepository,
        private socketService: SocketService
    ) {}

    async execute(sessionId: string, userId: string, isHost: boolean): Promise<any> {
        try {
            const videoSession = await this.videoSessionRepository.getVideoSessionBySessionId(
                new Types.ObjectId(sessionId)
            );


            if (!videoSession) {
                throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
            }

            if (videoSession.status !== 'active') {
                throw new AppError("Video session is not active", StatusCodes.BAD_REQUEST);
            }

            const updatedSession = isHost ? 
                await this.videoSessionRepository.updateHostJoinedAt(new Types.ObjectId(sessionId)) :
                await this.videoSessionRepository.updateParticipantJoinedAt(new Types.ObjectId(sessionId));

            const otherParticipantId = isHost ? 
                videoSession.participantId.toString() : 
                videoSession.hostId.toString();
            
            this.socketService.emitToUser(otherParticipantId, 'video:session:participant_joined', {
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
