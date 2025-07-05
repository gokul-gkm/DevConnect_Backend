import { INotification } from "@/domain/entities/Notification";

export interface IMarkNotificationAsReadUseCase{
    execute(notificationId: string, userId: string): Promise<INotification | null>
}