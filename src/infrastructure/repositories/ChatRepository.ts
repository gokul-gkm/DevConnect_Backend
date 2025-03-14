import { Chat, IChat } from "@/domain/entities/Chat";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";


export class ChatRepository implements IChatRepository {

    async createChat(userId: string, developerId: string): Promise<IChat> {
        try {
            const existingChat = await this.findChatByParticipants(userId, developerId);
            if (existingChat) {
                return existingChat
            }
            const chat = await Chat.create({
                userId: new mongoose.Types.ObjectId(userId),
                developerId: new mongoose.Types.ObjectId(developerId)
            });
            return await chat.populate([
                { path: 'userId', select: 'username profilePicture' },
                { path: 'developerId', select: 'username profilePicture'}
            ]);
        } catch (error: any) {
            if (error.code === 11000) {
                throw new AppError('Chat already exists', StatusCodes.CONFLICT)
            }
            throw new AppError('Failed to create chat', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async getChatById(chatId: string): Promise<IChat | null> {
        try {
            return await Chat.findById(chatId)
                .populate('userId', 'username profilePicture')
                .populate('developerId', 'username profilePicture');
        } catch (error) {
            throw new AppError('Failed to get chat', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async getUserChats(userId: string): Promise<IChat[]> {
        try {
            return await Chat.find({ userId })
                .populate('userId', 'username profilePicture')
                .populate('developerId', 'username profilePicture')
                .sort({lastMessageTime: -1})
        } catch (error) {
            throw new AppError('Failed to get user chats', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async getDeveloperChats(developerId: string): Promise<IChat[]> {
        try {
            return await Chat.find({ developerId })
                .populate('userId', 'username profilePicture')
                .populate('developerId', 'username profilePicture')
                .sort({ lastMessageTime: -1 })
        } catch (error) {
            throw new AppError('Failed to get developer chats', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async updateLastMessage(chatId: string, message: string, senderType: "user" | "developer"): Promise<void> {
        try {
            
            const update: any = {
                lastMessage: message,
                lastMessageTime: new Date()
            };

            if (senderType === 'user') {
                update.$inc = { developerUnreadCount: 1 };
            } else if (senderType === 'developer') {
                update.$inc = { userUnreadCount: 1 };
            }
            
            const updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                update,
                { new: true }
            );

            if (!updatedChat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND);
            }

            console.log('Updated chat unread counts:', {
                userUnreadCount: updatedChat.userUnreadCount,
                developerUnreadCount: updatedChat.developerUnreadCount
            });
        } catch (error) {
            console.error('Error updating last message:', error);
            throw new AppError('Failed to update last message', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async resetUnreadCount(chatId: string, type: "user" | "developer"): Promise<void> {
        try {
            console.log('Resetting unread count:', { chatId, type });
            
            const update = type === 'developer' 
                ? { userUnreadCount: 0 }
                : { developerUnreadCount: 0 };

            const updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                update,
                { new: true }
            );

            if (!updatedChat) {
                throw new AppError('Chat not found', StatusCodes.NOT_FOUND);
            }

            console.log('Reset unread count result:', {
                userUnreadCount: updatedChat.userUnreadCount,
                developerUnreadCount: updatedChat.developerUnreadCount,
                resetType: type,
                resetField: Object.keys(update)[0]
            });
        } catch (error) {
            console.error('Error resetting unread count:', error);
            throw new AppError('Failed to reset unread count', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async findChatByParticipants(userId: string, developerId: string): Promise<IChat | null> {
        try {
            return await Chat.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                developerId: new mongoose.Types.ObjectId(developerId)
            })
            .populate('userId', 'username profilePicture')
            .populate('developerId', 'username profilePicture')
        } catch (error) {
            throw new AppError('Failed to find chat', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}