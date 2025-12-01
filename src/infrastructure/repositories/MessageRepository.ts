import { IMessage, Message } from "@/domain/entities/Message";
import { AppError } from "@/domain/errors/AppError";
import { IMessageRepository } from "@/domain/interfaces/repositories/IMessageRepository";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { injectable } from "inversify";

@injectable()
export class MessageRepository extends BaseRepository<IMessage> implements IMessageRepository{

    constructor() {
        super(Message)
    }

    async createMessage(message: Partial<IMessage>): Promise<IMessage> {
        try {
            const newMessage = await Message.create({
                ...message,
                chatId: new mongoose.Types.ObjectId(message.chatId),
                senderId: new mongoose.Types.ObjectId(message.senderId)
            });
            return await newMessage.populate('senderId', 'username profilePicture')
        } catch (_error) {
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
        } catch (_error) {
            throw new AppError('Failed to get chat messages', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async markMessagesAsRead(chatId: string, recipientType: "user" | "developer"): Promise<string[]> {
        try {
            
            const senderType = recipientType === 'user' ? 'developer' : 'user';


            const messages = await Message.find({
                chatId,
                senderType: senderType,
                read: false
            }).select('_id senderType');


            if (messages.length > 0) {
                 await Message.updateMany(
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