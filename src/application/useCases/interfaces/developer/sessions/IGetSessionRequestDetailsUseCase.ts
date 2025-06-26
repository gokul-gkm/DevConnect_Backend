import { SessionDetails } from "@/domain/types/session";

export interface IGetSessionRequestDetailsUseCase{
    execute(sessionId: string): Promise<SessionDetails>
}