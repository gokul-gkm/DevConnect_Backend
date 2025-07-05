export interface ISetNewTokenUseCase{
    execute(token : string): Promise<any>
}