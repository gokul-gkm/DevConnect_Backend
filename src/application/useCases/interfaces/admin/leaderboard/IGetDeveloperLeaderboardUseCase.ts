export interface IGetDeveloperLeaderboardUseCase{
    execute(page :number, limit:number, sortBy : string):Promise<any>
}