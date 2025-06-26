export interface IGetScheduledSessionDetailsUseCase{
    execute(sessionId: string, developerId: string): Promise<any>
}