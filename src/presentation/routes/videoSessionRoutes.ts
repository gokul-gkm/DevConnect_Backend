import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { autherization } from "@/presentation/middleware/autherization";
import { VideoSessionController } from "../controllers/VideoSessionController";
import { VideoSessionRepository } from "@/infrastructure/repositories/VideoSessionRepository";
import { SessionRepository } from "@/infrastructure/repositories/SessionRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { WalletRepository } from "@/infrastructure/repositories/WalletRepository";

export const createVideoSessionRouter = () => {
    const videoSessionRouter = Router();
    const videoSessionRepository = new VideoSessionRepository();
    const sessionRepository = new SessionRepository();
    const socketService = SocketService.getInstance();
    const walletRepository = new WalletRepository();

    const videoSessionController = new VideoSessionController(
        videoSessionRepository,
        sessionRepository,
        socketService,
        walletRepository
    );

    videoSessionRouter.post('/:sessionId/init', authMiddleware, autherization, (req, res, next) => {
       
        videoSessionController.initVideoSession(req, res).catch(next);
    });

    videoSessionRouter.post('/:sessionId/init', authMiddleware, autherization, (req, res, next) => {
        videoSessionController.initVideoSession(req, res).catch(next);
    });

    videoSessionRouter.post('/:sessionId/join', authMiddleware, autherization, (req, res, next) => {
        videoSessionController.joinVideoSession(req, res).catch(next);
    });

    videoSessionRouter.post('/:sessionId/end', authMiddleware, autherization, (req, res, next) => {
        videoSessionController.endVideoSession(req, res).catch(next);
    });

    videoSessionRouter.get('/:sessionId', authMiddleware, autherization, (req, res, next) => {
        videoSessionController.getVideoSessionDetails(req, res).catch(next);
    });

    videoSessionRouter.get('/:sessionId/status', authMiddleware, autherization, (req, res, next) => {
        videoSessionController.getVideoSessionStatus(req, res).catch(next);
    });

    videoSessionRouter.post('/:sessionId/leave', authMiddleware, autherization, (req, res, next) => {
        videoSessionController.leaveVideoSession(req, res).catch(next);
    });

    return videoSessionRouter;
};
