export interface CreateChatDTO {
    userId: string;
    developerId: string;
}

export interface SendMessageDTO {
    chatId: string;
    content: string;
    senderId: string;
    senderType: 'user' | 'developer';
}

export interface GetMessagesDTO {
    chatId: string;
    page: number;
    limit: number;
}