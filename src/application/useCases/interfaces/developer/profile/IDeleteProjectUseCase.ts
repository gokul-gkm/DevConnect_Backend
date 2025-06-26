export interface IDeleteProjectUseCase{
    execute(developerId: string, projectId: string): Promise<any>
}