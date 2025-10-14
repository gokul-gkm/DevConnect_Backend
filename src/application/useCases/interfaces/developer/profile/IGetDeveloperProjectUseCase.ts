
export interface IGetDeveloperProjectUseCase{
    execute( projectId: string ):Promise<any>
}