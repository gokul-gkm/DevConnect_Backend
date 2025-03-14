import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { SessionController } from "../controllers/SessionController";
import { SessionRepository } from "@/infrastructure/repositories/SessionRepository";
import { MailService } from "@/infrastructure/mail/MailService";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { autherization } from "@/presentation/middleware/autherization";

const sessionRouter = Router()
const sessionRepository = new SessionRepository();
const userRepository = new UserRepository();
const developerRepository = new DeveloperRepository();
const mailService = new MailService()
const s3Service = new S3Service()

const sessionController = new SessionController(sessionRepository, mailService, userRepository, developerRepository,s3Service);

sessionRouter.get('/booked-slots', authMiddleware,autherization, (req, res, next) => {
    sessionController.getBookedSlots(req, res).catch(next);
});

sessionRouter.post('/create-session', authMiddleware,autherization, (req, res, next) => {
    sessionController.createSession(req, res).catch(next);
});
  
sessionRouter.get('/user', authMiddleware,autherization,  (req, res, next) => {
    sessionController.getUserSessions(req, res).catch(next)
});

sessionRouter.get('/upcoming-sessions', authMiddleware,autherization,  (req, res, next) => {
    sessionController.getUpcomingSessions(req, res).catch(next);
});

sessionRouter.get('/developer/requests', authMiddleware,autherization,  (req, res, next) => {
    sessionController.getSessionRequests(req, res).catch(next)
})

sessionRouter.patch('/:sessionId/accept', authMiddleware,autherization,  (req, res, next) => {
    sessionController.acceptSessionRequest(req, res).catch(next)
})

sessionRouter.patch('/:sessionId/reject', authMiddleware,autherization,  (req, res, next) => {
    sessionController.rejectSessionRequest(req, res).catch(next)
})

sessionRouter.get('/:sessionId', authMiddleware,autherization,  (req, res, next) => {
    sessionController.getSessionDetails(req, res).catch(next)
})

export default sessionRouter