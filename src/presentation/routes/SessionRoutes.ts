import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { SessionController } from "../controllers/SessionController";
import { SessionRepository } from "@/infrastructure/repositories/SessionRepository";
import { MailService } from "@/infrastructure/mail/MailService";

const sessionRouter = Router()
const sessionRepository = new SessionRepository();
const userRepository = new UserRepository();
const developerRepository = new DeveloperRepository();
const mailService = new MailService()

const sessionController = new SessionController(sessionRepository, mailService, userRepository, developerRepository);

sessionRouter.get('/booked-slots', authMiddleware, (req, res, next) => {
    sessionController.getBookedSlots(req, res).catch(next);
});

sessionRouter.post('/create-session', authMiddleware, (req, res, next) => {
    sessionController.createSession(req, res).catch(next);
});
  
sessionRouter.get('/user', authMiddleware, (req, res, next) => {
    sessionController.getUserSessions(req, res).catch(next)
});

sessionRouter.get('/upcoming-sessions', authMiddleware, (req, res, next) => {
    sessionController.getUpcomingSessions(req, res).catch(next);
});

sessionRouter.get('/developer/requests', authMiddleware, (req, res, next) => {
    sessionController.getSessionRequests(req, res).catch(next)
})

sessionRouter.patch('/:sessionId/accept', authMiddleware, (req, res, next) => {
    sessionController.acceptSessionRequest(req, res).catch(next)
})

sessionRouter.patch('/:sessionId/reject', authMiddleware, (req, res, next) => {
    sessionController.rejectSessionRequest(req, res).catch(next)
})

sessionRouter.get('/:sessionId', authMiddleware, (req, res, next) => {
    sessionController.getSessionDetails(req, res).catch(next)
})

export default sessionRouter