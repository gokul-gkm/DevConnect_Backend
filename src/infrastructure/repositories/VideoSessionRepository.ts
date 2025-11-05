import { IVideoSession } from "@/domain/entities/VideoSession";
import { IVideoSessionRepository } from "@/domain/interfaces/repositories/IVideoSessionRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { VideoSession } from "@/domain/entities/VideoSession";
import { BaseRepository } from "./BaseRepository";
import { injectable } from "inversify";

@injectable()
export class VideoSessionRepository extends BaseRepository<IVideoSession> implements IVideoSessionRepository {
    constructor() {
        super(VideoSession);
    }

    async createVideoSession(sessionData: Partial<IVideoSession>): Promise<IVideoSession> {
        try {
            const videoSession = new VideoSession(sessionData);
            await videoSession.save();
            return videoSession;
        } catch (_error) {
            throw new AppError('Failed to create video session', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async getVideoSessionBySessionId(sessionId: Types.ObjectId): Promise<IVideoSession | null> {
        try {
            return await VideoSession.findOne({ sessionId })
                .populate('hostId')
                .populate('participantId');
        } catch (_error) {
            throw new AppError('Failed to fetch video session', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async getVideoSessionByRoomId(roomId: string): Promise<IVideoSession | null> {
        try {
            return await VideoSession.findOne({ roomId })
                .populate('hostId')
                .populate('participantId');
        } catch (_error) {
            throw new AppError('Failed to fetch video session', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async updateVideoSessionStatus(sessionId: Types.ObjectId, status: string): Promise<IVideoSession | null> {
        try {
            return await VideoSession.findOneAndUpdate(
                { sessionId },
                { status },
                { new: true }
            ).populate('hostId').populate('participantId');
        } catch (_error) {
            throw new AppError('Failed to update video session status', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async updateHostJoinedAt(sessionId: Types.ObjectId): Promise<IVideoSession | null> {
        try {
            return await VideoSession.findOneAndUpdate(
                { sessionId },
                { hostJoinedAt: new Date() },
                { new: true }
            ).populate('hostId').populate('participantId');
        } catch (_error) {
            throw new AppError('Failed to update host join time', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async updateParticipantJoinedAt(sessionId: Types.ObjectId): Promise<IVideoSession | null> {
        try {
            return await VideoSession.findOneAndUpdate(
                { sessionId },
                { participantJoinedAt: new Date() },
                { new: true }
            ).populate('hostId').populate('participantId');
        } catch (_error) {
            throw new AppError('Failed to update participant join time', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async endVideoSession(sessionId: Types.ObjectId): Promise<IVideoSession | null> {
        try {
            return await VideoSession.findOneAndUpdate(
                { sessionId },
                {
                    status: 'ended',
                    endTime: new Date()
                },
                { new: true }
            ).populate('hostId').populate('participantId');
        } catch (_error) {
            throw new AppError('Failed to end video session', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
