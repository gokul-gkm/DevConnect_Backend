import { IVideoSession } from "../entities/VideoSession";
import { Types } from "mongoose";
import { IBaseRepository } from "./IBaseRepository";

export interface IVideoSessionRepository extends IBaseRepository<IVideoSession> {
    createVideoSession(sessionData: Partial<IVideoSession>): Promise<IVideoSession>;
    getVideoSessionBySessionId(sessionId: Types.ObjectId): Promise<IVideoSession | null>;
    getVideoSessionByRoomId(roomId: string): Promise<IVideoSession | null>;
    updateVideoSessionStatus(sessionId: Types.ObjectId, status: string): Promise<IVideoSession | null>;
    updateHostJoinedAt(sessionId: Types.ObjectId): Promise<IVideoSession | null>;
    updateParticipantJoinedAt(sessionId: Types.ObjectId): Promise<IVideoSession | null>;
    endVideoSession(sessionId: Types.ObjectId): Promise<IVideoSession | null>;
}
