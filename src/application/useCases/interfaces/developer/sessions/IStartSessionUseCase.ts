export interface IStartSessionUseCase{
    execute(sessionId: string): Promise<void>
}