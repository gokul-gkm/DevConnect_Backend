import { SendMessageDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class SendMessageUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private chatRepository: IChatRepository,
        private socketService: SocketService,
        private s3Service: S3Service
    ) { }
    
    async execute({ chatId, content, senderId, senderType, mediaType, mediaFile }: SendMessageDTO) {
        
        try {
            let mediaUrl = undefined;
            if (mediaFile && mediaType) {
                const uploadResult = await this.s3Service.uploadFile(
                    mediaFile, 
                    'chat-media'
                );
                mediaUrl = uploadResult.Key;
            }
            
            const message = await this.messageRepository.createMessage({
                chatId: new mongoose.Types.ObjectId(chatId),
                content,
                senderId: new mongoose.Types.ObjectId(senderId),
                senderType,
                mediaType,
                mediaUrl,
                read: false
            });
            
            await this.chatRepository.updateLastMessage(chatId, content, senderType);
            
            if (message.mediaUrl) {
                message.mediaUrl = await this.s3Service.generateSignedUrl(message.mediaUrl);
            }
            
            const chat = await this.chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }
            
            this.socketService.emitToChat(chatId, 'new-message', {
                chatId,
                message,
                chat
            });
            
            if (senderType === 'user') {
                this.socketService.emitToDeveloper(chat.developerId.toString(), 'new-message-notification', {
                    chatId,
                    message,
                    sender: chat.userId
                });
            } else {
                this.socketService.emitToUser(chat.userId.toString(), 'new-message-notification', {
                    chatId,
                    message,
                    sender: chat.developerId
                });
            }
            return message
        } catch (error) {
            console.error('💬 ERROR SENDING MESSAGE', error);
            throw new AppError('Failed to send message', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}