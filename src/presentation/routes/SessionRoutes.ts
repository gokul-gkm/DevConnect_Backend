import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { SessionController } from "../controllers/SessionController";
import { autherization } from "@/presentation/middleware/autherization";
import { container } from "@/infrastructure/config/inversify.config";
import { TYPES } from "@/types/types";

export const createSessionRouter = () => {
  const sessionRouter = Router();

  const sessionController = container.get<SessionController>(TYPES.SessionController);

  sessionRouter.get('/booked-slots', authMiddleware, autherization, (req, res, next) => {
    sessionController.getBookedSlots(req, res).catch(next);
  });

  sessionRouter.post('/', authMiddleware, autherization, (req, res, next) => {
    sessionController.createSession(req, res).catch(next);
  });
  
  sessionRouter.get('/user', authMiddleware, autherization, (req, res, next) => {
    sessionController.getUserSessions(req, res).catch(next);
  });

  sessionRouter.get('/upcoming', authMiddleware, autherization, (req, res, next) => {
    sessionController.getUpcomingSessions(req, res).catch(next);
  });

  sessionRouter.get('/history', authMiddleware, autherization, (req, res, next) => {
    sessionController.getSessionHistory(req, res).catch(next);
  });

  sessionRouter.get('/developer/requests', authMiddleware, autherization, (req, res, next) => {
    sessionController.getSessionRequests(req, res).catch(next);
  });

  sessionRouter.get('/developer/requests/:sessionId', authMiddleware, autherization, (req, res, next) => {
    sessionController.getSessionRequestDetails(req, res).catch(next);
  });

  sessionRouter.patch('/:sessionId/accept', authMiddleware, autherization, (req, res, next) => {
    sessionController.acceptSessionRequest(req, res).catch(next);
  });

  sessionRouter.patch('/:sessionId/reject', authMiddleware, autherization, (req, res, next) => {
    sessionController.rejectSessionRequest(req, res).catch(next);
  });

  sessionRouter.get('/unavailable-slots', authMiddleware, autherization, (req, res, next) => {
    sessionController.getUnavailableSlots(req, res).catch(next);
  });

 

  sessionRouter.get('/developer/scheduled', authMiddleware, autherization, (req, res, next) => {
    sessionController.getScheduledSessions(req, res).catch(next);
  });

  sessionRouter.get('/developer/scheduled/:sessionId', authMiddleware, autherization, (req, res, next) => {
    sessionController.getScheduledSessionDetails(req, res).catch(next);
  });

  sessionRouter.post('/:sessionId/start', authMiddleware, autherization, (req, res, next) => {
    sessionController.startSession(req, res).catch(next);
  });


  sessionRouter.get('/:sessionId', authMiddleware, autherization, (req, res, next) => {
    sessionController.getSessionDetails(req, res).catch(next);
  });

  sessionRouter.post('/:sessionId/rate', authMiddleware, autherization, (req, res, next) => {
    sessionController.rateSession(req, res).catch(next);
  });

sessionRouter.put('/:sessionId/rate', authMiddleware, autherization, (req, res, next) => {
  sessionController.updateRating(req, res).catch(next);
});

  sessionRouter.get('/developer/history', authMiddleware, autherization, (req, res, next) => {
    sessionController.getDeveloperSessionHistory(req, res).catch(next);
  });

  sessionRouter.get('/developer/history/:sessionId', authMiddleware, autherization, (req, res, next) => {
    sessionController.getDeveloperSessionHistoryDetails(req, res).catch(next);
  });

  sessionRouter.patch('/:sessionId/cancel', authMiddleware, autherization, (req, res, next) => {
    sessionController.cancelSession(req, res).catch(next);
  });

  return sessionRouter;
};