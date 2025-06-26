import { CreateSessionDTO } from "@/application/useCases/implements/user/session/CreateSessionUseCase";
import { ISession } from "@/domain/entities/Session";

export interface ICreateSessionUseCase{
    execute(data: CreateSessionDTO): Promise<ISession>
}