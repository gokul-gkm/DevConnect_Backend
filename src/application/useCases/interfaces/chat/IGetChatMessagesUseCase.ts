import { GetMessagesDTO } from "@/application/dto/chat/ChatDTO";

export interface IGetChatMessagesUseCase{
    execute({ chatId, page, limit }: GetMessagesDTO):Promise<any>
}