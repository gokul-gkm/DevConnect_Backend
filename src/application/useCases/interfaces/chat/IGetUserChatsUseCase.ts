export interface IGetUserChatsUseCase{
    execute(userId: string):Promise<any>
}