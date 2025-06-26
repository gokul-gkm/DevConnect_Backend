export interface IGetDeveloperMonthlyStatsUseCase{
    execute(developerId: string, year: number):Promise<any>
}