export interface IManageDefaultSlotsUseCase{
    getDefaultUnavailableSlots(developerId: string): Promise<string[]>
    updateDefaultUnavailableSlots(developerId: string, slots: string[]): Promise<void>
}