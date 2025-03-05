import { GetMessagesDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { StatusCodes } from "http-status-codes";

export class GetChatMessagesUseCase {
    constructor( 
        private messageRepository: IMessageRepository,
        private chatRepository: IChatRepository,
        private s3Service: S3Service
    ) { }
    
    async execute({ chatId, page, limit }: GetMessagesDTO) {
        try {
            const chat = await this.chatRepository.getChatById(chatId)
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }
            const messages = await this.messageRepository.getChatMessages(
                chatId,
                page,
                limit
            );
            return {
                messages: messages.messages,
                hasMore: messages.hasMore,
                total: messages.total,
                chat
            } 
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to get messages', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}