
import { CreateSessionDTO } from "@/application/dto/users/session/CreateSessionDTO";
import { ISession } from "@/domain/entities/Session";

export interface ICreateSessionUseCase{
    execute(data: CreateSessionDTO): Promise<ISession>
}