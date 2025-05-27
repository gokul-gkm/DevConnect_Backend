import { CreateChatUseCase } from "@/application/useCases/chat/CreateChatUseCase";
import { GetChatMessagesUseCase } from "@/application/useCases/chat/GetChatMessagesUseCase";
import { GetDeveloperChatsUseCase } from "@/application/useCases/chat/GetDeveloperChatsUseCase";
import { GetUserChatsUseCase } from "@/application/useCases/chat/GetUserChatsUseCase";
import { MarkMessagesAsReadUseCase } from "@/application/useCases/chat/MarkMessagesAsReadUseCase";
import { SendMessageUseCase } from "@/application/useCases/chat/SendMessageUseCase";
import { NextFunction } from "express";
import { z } from "zod";
import { Request, Response } from "express";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { IChats } from "@/types/chat";
import { ERROR_MESSAGES } from "@/utils/constants";

export class ChatController {
    private createChatUseCase: CreateChatUseCase;
    private getUserChatsUseCase: GetUserChatsUseCase;
    private getDeveloperChatsUseCase: GetDeveloperChatsUseCase;
    private getChatMessagesUseCase: GetChatMessagesUseCase;
    private sendMessageUseCase: SendMessageUseCase;
    private markMessagesAsReadUseCase: MarkMessagesAsReadUseCase;
    constructor(
        private chatRepository: IChatRepository,
        private messageRepository: IMessageRepository,
        private socketService: SocketService,
        private s3Service: S3Service
    ) {
        this.createChatUseCase = new CreateChatUseCase(chatRepository);
        this.getUserChatsUseCase = new GetUserChatsUseCase(chatRepository);
        this.getDeveloperChatsUseCase = new GetDeveloperChatsUseCase(chatRepository);
        this.getChatMessagesUseCase = new GetChatMessagesUseCase(messageRepository, chatRepository, s3Service);
        this.sendMessageUseCase = new SendMessageUseCase(messageRepository, chatRepository, socketService, s3Service)
        this.markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(messageRepository, chatRepository, socketService)
    }
    
    async createChat(req: Request, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                developerId: z.string()
            })
    
            const { developerId } = schema.parse(req.body);
            const userId = req.userId;
            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED,StatusCodes.BAD_REQUEST);
            }
            const chat = await this.createChatUseCase.execute({
                userId,
                developerId
            })
            return res.status(StatusCodes.CREATED).json({
                success: true,
                chat
            })
        } catch (error) {
            next(error);
        }
    }
    
    async getUserChats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError(ERROR_MESSAGES.USER_REQUIRED, StatusCodes.BAD_REQUEST)
            }
            const chats = await this.getUserChatsUseCase.execute(userId) as unknown as IChats[];
            
            const transformedChats = await Promise.all(chats.map(async (chat: IChats) => {
                let profilePictureUrl = null;
                if (chat.developerId?.profilePicture) {
                    profilePictureUrl = await this.s3Service.generateSignedUrl(chat.developerId.profilePicture);
                }

                let userProfilePictureUrl = null;
                if (chat.userId?.profilePicture) {
                    userProfilePictureUrl = await this.s3Service.generateSignedUrl(chat.userId?.profilePicture);
                }
    
                return {
                    _id: chat._id?.toString(),
                    userId: {
                        _id: chat.userId._id?.toString(),
                        username: chat.userId.username,
                        profilePicture: userProfilePictureUrl
                    },
                    developerId: {
                        _id: chat.developerId._id?.toString(),
                        username: chat.developerId.username,
                        profilePicture: profilePictureUrl
                    },
                    lastMessage: chat.lastMessage,
                    userUnreadCount: chat.userUnreadCount,
                    developerUnreadCount: chat.developerUnreadCount,
                    lastMessageTime: chat.lastMessageTime,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt
                };
            }));
    
            return res.status(StatusCodes.OK).json({
                success: true,
                chats: transformedChats
            });
        } catch (error) {
            next(error)
        }
    }

    async getDeveloperChats(req: Request, res: Response, next: NextFunction) {
        try {
            const developerId = req.userId;
            if (!developerId) {
                throw new AppError('Developer ID not found', StatusCodes.BAD_REQUEST)
            }

            const chats = await this.getDeveloperChatsUseCase.execute(developerId) as unknown as IChats[];
            
            const transformedChats = await Promise.all(chats.map(async (chat: IChats) => {
                let userProfilePictureUrl = null;
                if (chat.userId?.profilePicture) {
                    userProfilePictureUrl = await this.s3Service.generateSignedUrl(chat.userId.profilePicture);
                }

                let developerProfilePictureUrl = null;
                if (chat.developerId?.profilePicture) {
                    developerProfilePictureUrl = await this.s3Service.generateSignedUrl(chat.developerId.profilePicture);
                }
    
                return {
                    _id: chat._id?.toString(),
                    userId: {
                        _id: chat.userId._id?.toString(),
                        username: chat.userId.username,
                        profilePicture: userProfilePictureUrl
                    },
                    developerId: {
                        _id: chat.developerId._id?.toString(),
                        username: chat.developerId.username,
                        profilePicture: developerProfilePictureUrl
                    },
                    lastMessage: chat.lastMessage,
                    userUnreadCount: chat.userUnreadCount,
                    developerUnreadCount: chat.developerUnreadCount,
                    lastMessageTime: chat.lastMessageTime,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt
                };
            }));

            return res.status(StatusCodes.OK).json({
                success: true,
                chats: transformedChats
            })
        } catch (error) {
            next(error)
        }
    }

    async getChatMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                page: z.string().optional().transform(val => parseInt(val || '1')),
                limit: z.string().optional().transform(val => parseInt(val || '50'))
            });

            const { chatId } = req.params;
            const { page, limit } = schema.parse(req.query);

            const result = await this.getChatMessagesUseCase.execute({
                chatId,
                page,
                limit
            });

            return res.status(StatusCodes.OK).json({
                success: true,
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                content: z.string().min(1),
                chatId: z.string(),
                mediaType: z.enum(['image', 'video', 'audio', 'pdf', 'document']).optional(),
            });

            const { content, chatId, mediaType } = schema.parse(req.body);
            const mediaFile = req.file;
            
            const userId = req.userId;
            if (!userId) {
                throw new AppError('ID is required', StatusCodes.BAD_REQUEST);
            }
            
            const chat = await this.chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND);
            }
            
            const senderType = chat.userId.id.toString() === userId ? 'user' : 'developer';
            const senderId = senderType === 'user' ? chat.userId.id.toString() : chat.developerId.id.toString();

            const message = await this.sendMessageUseCase.execute({
                chatId,
                senderId,
                content,
                senderType,
                mediaType,
                mediaFile: mediaFile
            });

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message
            });
        } catch (error) {
            next(error);
        }
    }

    async markMessagesAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { chatId } = req.params;
            const chat = await this.chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }
            
            const isUser = chat.userId.id.toString() === req.userId;
            const isDeveloper = chat.developerId.id.toString() === req.userId;
            
            if (!isUser && !isDeveloper) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
            
            const recipientType = isUser ? 'user' : 'developer';

            await this.markMessagesAsReadUseCase.execute(chatId, recipientType);
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Messages marked as read'
            })
        } catch (error) {
            next(error)
        }
    }
}