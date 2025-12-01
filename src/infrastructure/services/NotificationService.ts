import { ICreateNotificationUseCase } from "@/application/useCases/interfaces/notification/ICreateNotificationUseCase";
import { INotification } from "@/domain/entities/Notification";
import { INotificationService } from "@/domain/interfaces/services/INotificationService";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class NotificationService implements INotificationService {

  constructor(
    @inject(TYPES.ICreateNotificationUseCase)
    private _createNotificationUseCase: ICreateNotificationUseCase
  ) { }

  async notify(
    recipientId: string,
    title: string,
    message: string,
    type: "message" | "session" | "update" | "alert",
    senderId?: string,
    relatedId?: string
  ): Promise<INotification> {
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
