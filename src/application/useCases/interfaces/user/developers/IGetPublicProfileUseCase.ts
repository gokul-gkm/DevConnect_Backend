export interface IGetPublicProfileUseCase{
    execute(developerId: string):Promise<any>
}