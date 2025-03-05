import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";

export class GetDeveloperChatsUseCase {
    constructor(private chatRepository: IChatRepository) { }
    
    async execute(developerId: string) {
        try {
            const chats = await this.chatRepository.getDeveloperChats(developerId);
            return chats
        } catch (error) {
            throw new AppError('Failed to get developer chats', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}