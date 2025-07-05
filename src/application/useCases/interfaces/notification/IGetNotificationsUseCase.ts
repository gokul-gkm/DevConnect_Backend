import { INotification } from "@/domain/entities/Notification";

export interface IGetNotificationsUseCase{
    execute(userId: string): Promise<INotification[]>
}