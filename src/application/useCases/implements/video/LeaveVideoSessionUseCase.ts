import { IVideoSessionRepository } from "@/domain/interfaces/repositories/IVideoSessionRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { ISocketService } from "@/domain/interfaces/services/ISocketService";
import { ILeaveVideoSessionUseCase } from "../../interfaces/video/ILeaveVideoSessionUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class LeaveVideoSessionUseCase implements ILeaveVideoSessionUseCase {
    constructor(
        @inject(TYPES.IVideoSessionRepository)
        private _videoSessionRepository: IVideoSessionRepository,
        @inject(TYPES.ISocketService)
        private _socketService: ISocketService
    ) {}

    async execute(sessionId: string, userId: string): Promise<any> {
        try {
            const videoSession = await this._videoSessionRepository.getVideoSessionBySessionId(
                new Types.ObjectId(sessionId)
            );

            if (!videoSession) {
                throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
            }

            if (videoSession.participantId._id.toString() !== userId) {
                throw new AppError("Unauthorized to leave this session", StatusCodes.FORBIDDEN);
            }

            this._socketService.emitToDeveloper(videoSession.hostId.toString(), 'video:session:participant_left', {
                sessionId
            });

            return { success: true };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to leave video session", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
