import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { ISocketService } from "@/domain/interfaces/ISocketService";
import { StatusCodes } from "http-status-codes";
import { IMarkMessagesAsReadUseCase } from "../../interfaces/chat/IMarkMessagesAsReadUseCase";

export class MarkMessagesAsReadUseCase implements IMarkMessagesAsReadUseCase{
    constructor(
        private _messageRepository: IMessageRepository,
        private _chatRepository: IChatRepository,
        private _socketService: ISocketService
    ){}
    async execute(chatId: string, recipientType: 'user' | 'developer') {
        try {
            
            const updatedMessages = await this._messageRepository.markMessagesAsRead(chatId, recipientType);
            
            await this._chatRepository.resetUnreadCount(chatId, recipientType);
            
            this._socketService.emitToChat(chatId, 'messages-read', {
                chatId,
                recipientType,
                messageIds: updatedMessages
            });
            
            return updatedMessages;
        } catch (error) {
            console.error('MarkMessagesAsReadUseCase: Error:', error);
            throw new AppError('Failed to mark messages as read', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}