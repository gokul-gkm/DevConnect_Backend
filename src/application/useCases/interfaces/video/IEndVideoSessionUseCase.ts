export interface IEndVideoSessionUseCase{
    execute(sessionId: string, developerId: string): Promise<any>
}