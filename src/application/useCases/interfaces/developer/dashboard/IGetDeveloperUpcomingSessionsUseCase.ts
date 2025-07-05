export interface IGetDeveloperUpcomingSessionsUseCase{
    execute(developerId: string, limit :number): Promise<any>
}