import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { autherization } from "@/presentation/middleware/autherization";
import { VideoSessionController } from "../controllers/VideoSessionController";
import { container } from "@/infrastructure/config/inversify.config";
import { TYPES } from "@/types/types";

export const createVideoSessionRouter = () => {
    const videoSessionRouter = Router();

    const videoSessionController = container.get<VideoSessionController>(TYPES.VideoSessionController);

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
