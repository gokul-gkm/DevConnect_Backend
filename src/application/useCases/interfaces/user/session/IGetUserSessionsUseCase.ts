import { ISession } from "@/domain/entities/Session";

export interface IGetUserSessionsUseCase{
    execute(userId: string): Promise<ISession[]>
}