export interface IGetUserProfileUseCase{
    execute(userId: string):Promise<any>
}