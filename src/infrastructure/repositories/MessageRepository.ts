import { IMessage, Message } from "@/domain/entities/Message";
import { AppError } from "@/domain/errors/AppError";
import { IMessageRepository } from "@/domain/interfaces/IMessageRepository";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export class MessageRepository implements IMessageRepository{
    async createMessage(message: Partial<IMessage>): Promise<IMessage> {
        try {
            const newMessage = await Message.create({
                ...message,
                chatId: new mongoose.Types.ObjectId(message.chatId),
                senderId: new mongoose.Types.ObjectId(message.senderId)
            });
            return await newMessage.populate('senderId', 'username profilePicture')
        } catch (error) {
            throw new AppError('Failed to create message', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async getChatMessages(chatId: string, page: number, limit: number): Promise<{ messages: IMessage[]; hasMore: boolean; total: number; }> {
        try {
            const skip = (page - 1) * limit;
            const [messages, total] = await Promise.all([
                Message.find({ chatId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('senderId', 'username profilePicture'),
                Message.countDocuments({ chatId })
            ]);

            return {
                messages,
                hasMore: total > skip + messages.length,
                total
            };
        } catch (error) {
            throw new AppError('Failed to get chat messages', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async markMessagesAsRead(chatId: string, recipientType: "user" | "developer"): Promise<string[]> {
        try {
            console.log('Starting markMessagesAsRead:', { chatId, recipientType });
            
            const senderType = recipientType === 'user' ? 'developer' : 'user';
            
            console.log('Looking for unread messages with:', {
                chatId,
                senderType,
                recipientType
            });

            const messages = await Message.find({
                chatId,
                senderType: senderType,
                read: false
            }).select('_id senderType');

            console.log('Found unread messages to mark as read:', messages.map(m => ({
                id: m._id.toString(),
                senderType: m.senderType
            })));

            if (messages.length > 0) {
                const updateResult = await Message.updateMany(
                    {
                        chatId,
                        senderType: senderType,
                        read: false
                    },
                    { read: true }
                );
            }

            const messageIds = messages.map(msg => msg._id.toString());
            
            return messageIds;
        } catch (error) {
            console.error('Error in markMessagesAsRead:', error);
            throw new AppError('Failed to mark messages as read', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}