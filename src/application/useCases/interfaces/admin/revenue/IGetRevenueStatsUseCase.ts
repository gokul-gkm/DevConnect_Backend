export interface IGetRevenueStatsUseCase{
    execute(page: number, limit: number):Promise<any>
}