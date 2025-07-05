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
    return await this.createNotificationUseCase.execute(
      recipientId,
      title,
      message,
      type,
      senderId,
      relatedId
    );
  }
}
