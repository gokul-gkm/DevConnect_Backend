import { IVideoSessionRepository } from "@/domain/interfaces/IVideoSessionRepository";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "mongoose";
import { ISocketService } from "@/domain/interfaces/ISocketService";
import { IEndVideoSessionUseCase } from "../../interfaces/video/IEndVideoSessionUseCase";
import { IWalletRepository } from "@/domain/interfaces/IWalletRepository";

export class EndVideoSessionUseCase implements IEndVideoSessionUseCase {
  constructor(
    private _videoSessionRepository: IVideoSessionRepository,
    private _sessionRepository: ISessionRepository,
    private _socketService: ISocketService,
    private _walletRepository: IWalletRepository
  ) {}

  async execute(sessionId: string, developerId: string): Promise<any> {
    try {
      const videoSession =
        await this._videoSessionRepository.getVideoSessionBySessionId(
          new Types.ObjectId(sessionId)
        );

      if (!videoSession) {
        throw new AppError("Video session not found", StatusCodes.NOT_FOUND);
      }

      if (videoSession.hostId._id.toString() !== developerId) {
        throw new AppError(
          "Only host can end the session",
          StatusCodes.FORBIDDEN
        );
      }

      const updatedVideoSession =
        await this._videoSessionRepository.endVideoSession(
          new Types.ObjectId(sessionId)
        );

      await this._sessionRepository.updateSessionStatus(
        new Types.ObjectId(sessionId),
        "completed"
      );

      const session = await this._sessionRepository.getSessionById(
        new mongoose.Types.ObjectId(sessionId)
      );
      const amount = session.price;
      const developerAmount = amount * 0.8;

      const adminWallet = await this._walletRepository.findByAdminId(
        process.env.ADMIN_ID!
      );
      const developerWallet = await this._walletRepository.findByUserId(
        new mongoose.Types.ObjectId(developerId)
      );

      if (!adminWallet || !developerWallet) {
        throw new AppError("Wallet not found", StatusCodes.NOT_FOUND);
      }

      await this._walletRepository.transferFunds(
        adminWallet._id,
        developerWallet._id,
        developerAmount,
        session._id
      );

      this._socketService.emitToUser(
        videoSession.participantId._id.toString(),
        "video:session:ended",
        {
          sessionId,
        }
      );

      return updatedVideoSession;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to end video session",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}
