import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { StatusCodes } from "http-status-codes";

export class MarkMessagesAsReadUseCase{
    constructor(
        private messageRepository: IMessageRepository,
        private chatRepository: IChatRepository,
        private socketService: SocketService
    ){}
    async execute(chatId: string, recipientType: 'user' | 'developer') {
        try {
            await this.messageRepository.markMessagesAsRead(chatId, recipientType);
            await this.chatRepository.resetUnreadCount(chatId, recipientType)

            this.socketService.emitToChat(chatId, 'messages-read', {
                chatId,
                recipientType
            });

        } catch (error) {
            throw new AppError('Failed to mark messages as read', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}