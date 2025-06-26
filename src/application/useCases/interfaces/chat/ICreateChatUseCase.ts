
import { CreateChatDTO } from "@/application/dto/chat/ChatDTO";

export interface ICreateChatUseCase {
  execute(data: CreateChatDTO): Promise<any>;
}
