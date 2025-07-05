export interface IAcceptSessionRequestUseCase{
    execute(sessionId: string, developerId: string): Promise<any>
}