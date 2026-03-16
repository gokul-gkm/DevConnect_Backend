export interface ICheckUsernameAvailabilityUseCase{
    execute(username: string, excludeUserId?: string): Promise<boolean>
}