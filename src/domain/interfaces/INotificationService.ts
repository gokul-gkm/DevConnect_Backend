export interface INotificationService {
  notify(
    recipientId: string,
    title: string,
    message: string,
    type: "message" | "session" | "update" | "alert",
    senderId?: string,
    relatedId?: string
  ): Promise<any>;
} 