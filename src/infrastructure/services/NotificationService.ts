import { CreateNotificationUseCase } from "@/application/useCases/notification/CreateNotificationUseCase";
import { NotificationRepository } from "@/infrastructure/repositories/NotificationRepositoty";
import { SocketService } from "@/infrastructure/services/SocketService";

export class NotificationService {
  private createNotificationUseCase: CreateNotificationUseCase;

  constructor(
    private notificationRepository: NotificationRepository,
    private socketService: SocketService
  ) {
    this.createNotificationUseCase = new CreateNotificationUseCase(
      this.notificationRepository,
      this.socketService
    );
  }

  async notify(
    recipientId: string,
    title: string,
    message: string,
    type: "message" | "session" | "update" | "alert",
    senderId?: string,
    relatedId?: string
  ) {
    try {
      const notification = await this.createNotificationUseCase.execute(
        recipientId,
        title,
        message,
        type,
        senderId,
        relatedId
      );

      // // Emit notification only once here
      // if (this.socketService.isUserOnline(recipientId)) {
      //   console.log('Emitting notification to user:', recipientId);
      //   this.socketService.emitToUser(recipientId, 'notification:new', {
      //     notification: {
      //       id: notification._id,
      //       title: notification.title,
      //       message: notification.message,
      //       type: notification.type,
      //       isRead: notification.isRead,
      //       timestamp: notification.createdAt,
      //       sender: notification.sender
      //     }
      //   });
      // }

      // // Also emit to developer if the recipient is a developer
      // if (this.socketService.isDeveloperOnline(recipientId)) {
      //   this.socketService.emitToDeveloper(recipientId, 'notification:new', {
      //     notification: {
      //       id: notification._id,
      //       title: notification.title,
      //       message: notification.message,
      //       type: notification.type,
      //       isRead: notification.isRead,
      //       timestamp: notification.createdAt,
      //       sender: notification.sender
      //     }
      //   });
      // }

      return notification;
    } catch (error) {
      console.error('Error in NotificationService.notify:', error);
      throw error;
    }
  }
}
