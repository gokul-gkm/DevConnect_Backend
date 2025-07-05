export interface IGetDeveloperProfileUseCase{
    execute(userId: string):Promise<any>
}