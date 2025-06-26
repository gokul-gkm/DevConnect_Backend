export interface IGetScheduledSessionsUseCase{
    execute(developerId: string, page: number, limit: number): Promise<any>
}