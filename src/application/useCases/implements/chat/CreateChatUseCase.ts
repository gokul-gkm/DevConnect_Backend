import { CreateChatDTO } from "@/application/dto/chat/ChatDTO";
import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/repositories/IChatRepository";
import { StatusCodes } from "http-status-codes";
import { ICreateChatUseCase } from "../../interfaces/chat/ICreateChatUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class CreateChatUseCase implements ICreateChatUseCase {
    constructor(
        @inject(TYPES.IChatRepository)
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
        } catch (_error) {
            throw new AppError('Failed to create chat', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}