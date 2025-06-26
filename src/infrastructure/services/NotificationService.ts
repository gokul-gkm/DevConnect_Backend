import { CreateNotificationUseCase } from "@/application/useCases/implements/notification/CreateNotificationUseCase";
import { INotificationRepository } from "@/domain/interfaces/INotificationRepository";
import { INotificationService } from "@/domain/interfaces/INotificationService";
import { ISocketService } from "@/domain/interfaces/ISocketService";

export class NotificationService implements INotificationService {
  private createNotificationUseCase: CreateNotificationUseCase;

  constructor(
    private notificationRepository: INotificationRepository,
    private socketService: ISocketService
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
  ): Promise<any> {
    try {
      const notification = await this.createNotificationUseCase.execute(
        recipientId,
        title,
        message,
        type,
        senderId,
        relatedId
      );

      return notification;
    } catch (error) {
      console.error('Error in NotificationService.notify:', error);
      throw error;
    }
  }
}
