import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepositoty';
import { SocketService } from '@/infrastructure/services/SocketService';
import { authMiddleware } from '../middleware/authMiddleware';
import { autherization } from '../middleware/autherization';

export const createNotificationRouter = () => {
  const notificationRouter = Router();
  const notificationRepository = new NotificationRepository();
  const socketService = SocketService.getInstance();
  
  const notificationController = new NotificationController(notificationRepository, socketService);

  notificationRouter.use(authMiddleware, autherization);

  notificationRouter.get('/', (req, res) => {
    notificationController.getNotifications(req, res);
  });

  notificationRouter.get('/unread-count', (req, res) => {
    notificationController.getUnreadCount(req, res);
  });

  notificationRouter.patch('/:notificationId/read', (req, res) => {
    notificationController.markAsRead(req, res);
  });

  notificationRouter.patch('/read-all', (req, res) => {
    notificationController.markAllAsRead(req, res);
  });

  notificationRouter.delete('/:notificationId', (req, res) => {
    notificationController.deleteNotification(req, res);
  });

  return notificationRouter;
};