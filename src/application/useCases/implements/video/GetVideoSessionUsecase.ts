import { inject, injectable } from "inversify";
import { Types } from "mongoose";
import { IVideoSessionRepository } from "@/domain/interfaces/repositories/IVideoSessionRepository";
import { IGetVideoSessionUseCase } from "@/application/useCases/interfaces/video/IGetVideoSessionUseCase";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { TYPES } from "@/types/types";

@injectable()
export class GetVideoSessionUseCase implements IGetVideoSessionUseCase {
    constructor(
        @inject(TYPES.IVideoSessionRepository) 
        private _videoSessionRepository: IVideoSessionRepository
    ) {}

    async execute(sessionId: string) {
        const videoSession = await this._videoSessionRepository.getVideoSessionBySessionId(
            new Types.ObjectId(sessionId)
        );

        if (!videoSession) {
            throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
        }

        return videoSession;
    }
}
