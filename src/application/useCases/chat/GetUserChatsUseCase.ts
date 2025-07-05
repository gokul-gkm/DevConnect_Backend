import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";

export class GetUserChatsUseCase {
    constructor(private chatRepository: IChatRepository) { }
    
    async execute(userId: string) {
        try {
            const chats = await this.chatRepository.getUserChats(userId);
            return chats
        } catch (error) {
            throw new AppError('Failed to get user chats', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}