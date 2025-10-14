export interface IGetChatByIdUseCase{
    execute(userId: string):Promise<any>
}