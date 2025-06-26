export interface IGetDeveloperChatsUseCase{
    execute(developerId: string): Promise<any>
}