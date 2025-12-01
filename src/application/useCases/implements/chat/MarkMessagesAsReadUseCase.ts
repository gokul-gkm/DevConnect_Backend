import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/repositories/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/repositories/IMessageRepository";
import { ISocketService } from "@/domain/interfaces/services/ISocketService";
import { StatusCodes } from "http-status-codes";
import { IMarkMessagesAsReadUseCase } from "../../interfaces/chat/IMarkMessagesAsReadUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class MarkMessagesAsReadUseCase implements IMarkMessagesAsReadUseCase{
    constructor(
        @inject(TYPES.IMessageRepository)
        private _messageRepository: IMessageRepository,
        @inject(TYPES.IChatRepository)
        private _chatRepository: IChatRepository,
        @inject(TYPES.ISocketService)
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