import { CreateNotificationUseCase } from "@/application/useCases/implements/notification/CreateNotificationUseCase";
import { ICreateNotificationUseCase } from "@/application/useCases/interfaces/notification/ICreateNotificationUseCase";
import { INotificationRepository } from "@/domain/interfaces/INotificationRepository";
import { INotificationService } from "@/domain/interfaces/INotificationService";
import { ISocketService } from "@/domain/interfaces/ISocketService";

export class NotificationService implements INotificationService {
  private _createNotificationUseCase: ICreateNotificationUseCase;

  constructor(
    private _notificationRepository: INotificationRepository,
    private _socketService: ISocketService
  ) {
    this._createNotificationUseCase = new CreateNotificationUseCase(
      _notificationRepository,
      _socketService
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
      const notification = await this._createNotificationUseCase.execute(
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
