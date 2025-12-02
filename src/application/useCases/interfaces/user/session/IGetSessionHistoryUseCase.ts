import { ISession } from "@/domain/entities/Session";
import { IPagination } from "@/domain/types/session";

export interface IGetSessionHistoryUseCase{
    execute(userId: string, page :number, limit: number): Promise<{ sessions: ISession[], pagination: IPagination }>
}