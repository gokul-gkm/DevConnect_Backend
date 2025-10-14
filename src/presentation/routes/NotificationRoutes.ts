import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { autherization } from '../middleware/autherization';
import { container } from '@/infrastructure/config/inversify.config';
import { TYPES } from '@/types/types';

export const createNotificationRouter = () => {
  const notificationRouter = Router();
  const notificationController = container.get<NotificationController>(TYPES.NotificationController);

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