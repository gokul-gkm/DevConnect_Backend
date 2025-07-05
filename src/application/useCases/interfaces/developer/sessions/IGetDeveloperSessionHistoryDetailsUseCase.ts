export interface IGetDeveloperSessionHistoryDetailsUseCase{
    execute(developerId: string, sessionId: string):Promise<any>
}