export interface IGetDeveloperSessionHistoryUseCase{
    execute(developerId: string, page: number, limit: number, search: string):Promise<any>
}