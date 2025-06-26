import { SendMessageDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { ISocketService } from "@/domain/interfaces/ISocketService";
import { ISendMessageUseCase } from "../../interfaces/chat/ISendMessageUseCase";

export class SendMessageUseCase implements ISendMessageUseCase {
    constructor(
        private _messageRepository: IMessageRepository,
        private _chatRepository: IChatRepository,
        private _socketService: ISocketService,
        private _s3Service: IS3Service
    ) { }
    
    async execute({ chatId, content, senderId, senderType, mediaType, mediaFile }: SendMessageDTO) {
        
        try {
            let mediaUrl = undefined;
            if (mediaFile && mediaType) {
                const uploadResult = await this._s3Service.uploadFile(
                    mediaFile, 
                    'chat-media'
                );
                mediaUrl = uploadResult.Key;
            }
            
            const message = await this._messageRepository.createMessage({
                chatId: new mongoose.Types.ObjectId(chatId),
                content,
                senderId: new mongoose.Types.ObjectId(senderId),
                senderType,
                mediaType,
                mediaUrl,
                read: false
            });
            
            await this._chatRepository.updateLastMessage(chatId, content, senderType);
            
            if (message.mediaUrl) {
                message.mediaUrl = await this._s3Service.generateSignedUrl(message.mediaUrl);
            }
            
            const chat = await this._chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }
            
            this._socketService.emitToChat(chatId, 'new-message', {
                chatId,
                message,
                chat
            });
            
            if (senderType === 'user') {
                this._socketService.emitToDeveloper(chat.developerId.toString(), 'new-message-notification', {
                    chatId,
                    message,
                    sender: chat.userId
                });
            } else {
                this._socketService.emitToUser(chat.userId.toString(), 'new-message-notification', {
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