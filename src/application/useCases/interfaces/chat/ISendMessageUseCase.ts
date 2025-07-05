import { SendMessageDTO } from "@/application/dto/chat/ChatDTO";

export interface ISendMessageUseCase{
    execute({ chatId, content, senderId, senderType, mediaType, mediaFile }: SendMessageDTO):Promise<any>
}