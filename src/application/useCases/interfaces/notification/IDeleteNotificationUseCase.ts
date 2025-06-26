export interface IDeleteNotificationUseCase{
    execute(notificationId: string, userId: string): Promise<boolean>
}