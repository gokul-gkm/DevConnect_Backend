import { CreateChatDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";

export class CreateChatUseCase {
    constructor(private chatRepository: IChatRepository) { }
    
    async execute({ userId, developerId }: CreateChatDTO) {
        try {
            const existingChat = await this.chatRepository.findChatByParticipants(userId, developerId)
            if (existingChat) {
                return existingChat;
            }
            const chat = await this.chatRepository.createChat(userId, developerId);
            return chat
        } catch (error) {
            throw new AppError('Failed to create chat', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}