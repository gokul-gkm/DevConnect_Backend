export interface IInitVideoSessionUseCase{
    execute(sessionId: string, developerId: string): Promise<any>
}