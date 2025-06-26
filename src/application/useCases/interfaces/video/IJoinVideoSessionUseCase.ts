export interface IJoinVideoSessionUseCase{
    execute(sessionId: string, userId: string, isHost: boolean): Promise<any>
}