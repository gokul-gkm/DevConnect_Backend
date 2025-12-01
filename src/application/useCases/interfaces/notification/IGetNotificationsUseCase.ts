import { INotification } from "@/domain/entities/Notification";

export interface IGetNotificationsUseCase{
    execute(userId: string, page :number, limit:number): Promise<{
        items: INotification[];
        pagination: { page: number; limit: number; totalPages: number; totalItems: number };
        totalsByType: { message: number; session: number; update: number; alert: number };
      }> 
}