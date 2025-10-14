export interface IGetBookedSlotsUseCase {
  execute(developerId: string, date: string): Promise<{ startTime: Date; duration: number }[]>;
}
