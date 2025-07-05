export interface IManageDeveloperUnavailabilityUseCase{
    getUnavailableSlots(developerId: string, date: Date): Promise<string[]>
    updateUnavailableSlots(developerId: string, date: Date, slots: string[]): Promise<void>
}