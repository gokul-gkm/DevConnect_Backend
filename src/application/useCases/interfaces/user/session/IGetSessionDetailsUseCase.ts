import { SessionDetails } from "@/domain/types/session";

export interface IGetSessionDetailsUseCase{
    execute(sessionId: string): Promise<SessionDetails>
}