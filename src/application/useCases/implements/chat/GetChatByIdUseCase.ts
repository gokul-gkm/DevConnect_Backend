import { AppError } from "@/domain/errors/AppError";
import { IChatRepository } from "@/domain/interfaces/IChatRepository";
import { StatusCodes } from "http-status-codes";
import { IGetChatByIdUseCase } from "../../interfaces/chat/IGetChatByIdUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class GetChatByIdUseCase implements IGetChatByIdUseCase {
  constructor(
    @inject(TYPES.IChatRepository)
    private _chatRepository: IChatRepository,
  ) {}

  async execute(chatId: string) {
    const chat = await this._chatRepository.getChatById(chatId);

    if (!chat) {
      throw new AppError("Chat not found", StatusCodes.NOT_FOUND);
    }
      
    return chat

  }
}
