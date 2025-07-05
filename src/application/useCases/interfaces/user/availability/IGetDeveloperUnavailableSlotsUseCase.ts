export interface IGetDeveloperUnavailableSlotsUseCase{
    execute(developerId: string, date: Date): Promise<string[]>
}