import { CreateChatDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";
import { ICreateChatUseCase } from "../../interfaces/chat/ICreateChatUseCase";

export class CreateChatUseCase implements ICreateChatUseCase {
    constructor(
        private _chatRepository: IChatRepository
    ) { }
    
    async execute({ userId, developerId }: CreateChatDTO) {
        try {
            const existingChat = await this._chatRepository.findChatByParticipants(userId, developerId)
            if (existingChat) {
                return existingChat;
            }
            const chat = await this._chatRepository.createChat(userId, developerId);
            return chat
        } catch (error) {
            throw new AppError('Failed to create chat', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}