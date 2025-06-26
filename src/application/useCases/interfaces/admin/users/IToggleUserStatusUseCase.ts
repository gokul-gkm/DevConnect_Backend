export interface IToggleUserStatusUseCase{
    execute(userId: string): Promise<void>
}