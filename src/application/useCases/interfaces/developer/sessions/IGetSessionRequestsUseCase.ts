export interface IGetSessionRequestsUseCase{
    execute(developerId: string, page: number , limit: number):Promise<any>
}