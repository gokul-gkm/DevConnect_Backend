import { NextFunction } from "express";
import { z } from "zod";
import { IChats } from "@/types/chat";
import { Request, Response } from "express";
import { AppError } from "@/domain/errors/AppError";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";

import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { SocketService } from "@/infrastructure/services/SocketService";
import { S3Service } from "@/infrastructure/services/S3_Service";

import { CreateChatUseCase } from "@/application/useCases/implements/chat/CreateChatUseCase";
import { GetChatMessagesUseCase } from "@/application/useCases/implements/chat/GetChatMessagesUseCase";
import { GetDeveloperChatsUseCase } from "@/application/useCases/implements/chat/GetDeveloperChatsUseCase";
import { GetUserChatsUseCase } from "@/application/useCases/implements/chat/GetUserChatsUseCase";
import { MarkMessagesAsReadUseCase } from "@/application/useCases/implements/chat/MarkMessagesAsReadUseCase";
import { SendMessageUseCase } from "@/application/useCases/implements/chat/SendMessageUseCase";

import { ICreateChatUseCase } from "@/application/useCases/interfaces/chat/ICreateChatUseCase";
import { IGetUserChatsUseCase } from "@/application/useCases/interfaces/chat/IGetUserChatsUseCase";
import { IGetDeveloperChatsUseCase } from "@/application/useCases/interfaces/chat/IGetDeveloperChatsUseCase";
import { IGetChatMessagesUseCase } from "@/application/useCases/interfaces/chat/IGetChatMessagesUseCase";
import { ISendMessageUseCase } from "@/application/useCases/interfaces/chat/ISendMessageUseCase";
import { IMarkMessagesAsReadUseCase } from "@/application/useCases/interfaces/chat/IMarkMessagesAsReadUseCase";

export class ChatController {
    private _createChatUseCase: ICreateChatUseCase;
    private _getUserChatsUseCase: IGetUserChatsUseCase;
    private _getDeveloperChatsUseCase: IGetDeveloperChatsUseCase;
    private _getChatMessagesUseCase: IGetChatMessagesUseCase;
    private _sendMessageUseCase: ISendMessageUseCase;
    private _markMessagesAsReadUseCase: IMarkMessagesAsReadUseCase;
    constructor(
        private _chatRepository: IChatRepository,
        private _messageRepository: IMessageRepository,
        private _socketService: SocketService,
        private _s3Service: S3Service
    ) {
        this._createChatUseCase = new CreateChatUseCase(_chatRepository);
        this._getUserChatsUseCase = new GetUserChatsUseCase(_chatRepository);
        this._getDeveloperChatsUseCase = new GetDeveloperChatsUseCase(_chatRepository);
        this._getChatMessagesUseCase = new GetChatMessagesUseCase(_messageRepository, _chatRepository, _s3Service);
        this._sendMessageUseCase = new SendMessageUseCase(_messageRepository, _chatRepository, _socketService, _s3Service)
        this._markMessagesAsReadUseCase = new MarkMessagesAsReadUseCase(_messageRepository, _chatRepository, _socketService)
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
            const chat = await this._createChatUseCase.execute({
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
            const chats = await this._getUserChatsUseCase.execute(userId) as unknown as IChats[];
            
            const transformedChats = await Promise.all(chats.map(async (chat: IChats) => {
                let profilePictureUrl = null;
                if (chat.developerId?.profilePicture) {
                    profilePictureUrl = await this._s3Service.generateSignedUrl(chat.developerId.profilePicture);
                }

                let userProfilePictureUrl = null;
                if (chat.userId?.profilePicture) {
                    userProfilePictureUrl = await this._s3Service.generateSignedUrl(chat.userId?.profilePicture);
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

            const chats = await this._getDeveloperChatsUseCase.execute(developerId) as unknown as IChats[];
            
            const transformedChats = await Promise.all(chats.map(async (chat: IChats) => {
                let userProfilePictureUrl = null;
                if (chat.userId?.profilePicture) {
                    userProfilePictureUrl = await this._s3Service.generateSignedUrl(chat.userId.profilePicture);
                }

                let developerProfilePictureUrl = null;
                if (chat.developerId?.profilePicture) {
                    developerProfilePictureUrl = await this._s3Service.generateSignedUrl(chat.developerId.profilePicture);
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

            const result = await this._getChatMessagesUseCase.execute({
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
            
            const chat = await this._chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND);
            }
            
            const senderType = chat.userId.id.toString() === userId ? 'user' : 'developer';
            const senderId = senderType === 'user' ? chat.userId.id.toString() : chat.developerId.id.toString();

            const message = await this._sendMessageUseCase.execute({
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
            const chat = await this._chatRepository.getChatById(chatId);
            if (!chat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND)
            }
            
            const isUser = chat.userId.id.toString() === req.userId;
            const isDeveloper = chat.developerId.id.toString() === req.userId;
            
            if (!isUser && !isDeveloper) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
            
            const recipientType = isUser ? 'user' : 'developer';

            await this._markMessagesAsReadUseCase.execute(chatId, recipientType);
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Messages marked as read'
            })
        } catch (error) {
            next(error)
        }
    }
}