export interface CreateChatDTO {
    userId: string;
    developerId: string;
}

export interface SendMessageDTO {
    chatId: string;
    content: string;
    senderId: string;
    senderType: 'user' | 'developer';
    mediaType?: 'image' | 'video' | 'audio' | 'pdf' | 'document';
    mediaFile?: Express.Multer.File;
}

export interface GetMessagesDTO {
    chatId: string;
    page: number;
    limit: number;
}