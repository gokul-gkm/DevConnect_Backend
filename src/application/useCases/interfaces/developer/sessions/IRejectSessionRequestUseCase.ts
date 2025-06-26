export interface IRejectSessionRequestUseCase{
    execute(sessionId: string, developerId: string, rejectionReason: string):Promise<any>
}