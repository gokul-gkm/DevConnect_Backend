import { IVideoSessionRepository } from "@/domain/interfaces/repositories/IVideoSessionRepository";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { ISocketService } from "@/domain/interfaces/services/ISocketService";
import { IInitVideoSessionUseCase } from "../../interfaces/video/IInitVideoSessionUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";
import logger from "@/utils/logger";

@injectable()
export class InitVideoSessionUseCase implements IInitVideoSessionUseCase {
    constructor(
        @inject(TYPES.IVideoSessionRepository)
        private _videoSessionRepository: IVideoSessionRepository,
        @inject(TYPES.ISessionRepository)
        private _sessionRepository: ISessionRepository,
        @inject(TYPES.ISocketService)
        private _socketService: ISocketService
    ) {}

    async execute(sessionId: string, developerId: string): Promise<any> {
        try {
            const session = await this._sessionRepository.getSessionById(new Types.ObjectId(sessionId));
            if (!session) {
                throw new AppError("Session not found", StatusCodes.NOT_FOUND);
            }


            if (session.status !== 'scheduled') {
                throw new AppError("Session is not scheduled", StatusCodes.BAD_REQUEST);
            }
   
            const videoSession = await this._videoSessionRepository.createVideoSession({
                sessionId: new Types.ObjectId(sessionId),
                roomId: uuidv4(),
                status: 'active',
                startTime: new Date(),
                hostId: new Types.ObjectId(developerId),
                participantId: session.userId,
                hostJoinedAt: new Date()
            });


            await this._sessionRepository.updateSessionStatus(new Types.ObjectId(sessionId), 'active');

            const userId = session.userId.toString();
        const eventData = {
            sessionId,
            roomId: videoSession.roomId
        };

        console.log("📞 [InitVideoSession] Emitting video:session:initiated event", {
            userId,
            sessionId,
            roomId: videoSession.roomId,
            timestamp: new Date().toISOString()
        });

            if (this._socketService.isOnline(userId)) {
           logger.info("🟢 USER_ONLINE", { userId });
//   this._socketService.emitNotification(userId, {
//     type: 'video:session:initiated',
//     payload: {
//       sessionId,
//       roomId: videoSession.roomId
//     }
//   });
     this._socketService.emitToUser(
        userId,
        "video:session:initiated",
        {
            sessionId,
            roomId: videoSession.roomId
        }
        );

            } else {
             logger.warn("🔴 USER_OFFLINE", { userId });
       }


        console.log("📞 [InitVideoSession] ✅ Event emitted successfully");

            return videoSession;
        } catch (error) {
            console.error("📞 [InitVideoSession] ❌ Error:", error);
            if (error instanceof AppError) throw error;
            throw new AppError("Failed to initialize video session", StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
