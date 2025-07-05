import { GetMessagesDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { StatusCodes } from "http-status-codes";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IGetChatMessagesUseCase } from "../../interfaces/chat/IGetChatMessagesUseCase";

export class GetChatMessagesUseCase implements IGetChatMessagesUseCase {
    constructor( 
        private _messageRepository: IMessageRepository,
        private _chatRepository: IChatRepository,
        private _s3Service: IS3Service
    ) { }
    
    async execute({ chatId, page, limit }: GetMessagesDTO) {
        try {
            const chat = await this._chatRepository.getChatById(chatId)
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }
            
            const messages = await this._messageRepository.getChatMessages(
                chatId,
                page,
                limit
            );
            
            const processedMessages = await Promise.all(
                messages.messages.map(async (message) => {
                    if (message.mediaUrl) {
                        message.mediaUrl = await this._s3Service.generateSignedUrl(message.mediaUrl);
                    }
                    return message;
                })
            );
            
            return {
                messages: processedMessages,
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