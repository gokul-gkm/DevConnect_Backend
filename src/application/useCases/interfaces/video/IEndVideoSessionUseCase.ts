import { IVideoSession } from "@/domain/entities/VideoSession";

export interface IEndVideoSessionUseCase {
    execute(sessionId: string, developerId: string): Promise<IVideoSession | null>;
}