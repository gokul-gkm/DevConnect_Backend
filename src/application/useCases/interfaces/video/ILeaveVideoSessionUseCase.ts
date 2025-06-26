export interface ILeaveVideoSessionUseCase{
    execute(sessionId: string, userId: string): Promise<any>
}