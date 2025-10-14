export interface IGetVideoSessionUseCase{
    execute(sessionId: string): Promise<any>
}