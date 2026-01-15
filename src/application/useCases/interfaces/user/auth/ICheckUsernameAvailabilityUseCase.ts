export interface ICheckUsernameAvailabilityUseCase{
    execute(username: string): Promise<boolean>
}