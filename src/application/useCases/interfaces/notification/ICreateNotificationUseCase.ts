import { INotification } from "@/domain/entities/Notification";

export interface ICreateNotificationUseCase{
    execute(
        recipientId: string,
        title: string,
        message: string,
        type: 'message' | 'session' | 'update' | 'alert',
        senderId?: string,
        relatedId?: string
      ): Promise<INotification>
}