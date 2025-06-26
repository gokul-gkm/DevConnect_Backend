import { ISession } from "@/domain/entities/Session";

export interface IGetSessionHistoryUseCase{
    execute(userId: string, page :number, limit: number): Promise<{ sessions: ISession[], pagination: any }>
}