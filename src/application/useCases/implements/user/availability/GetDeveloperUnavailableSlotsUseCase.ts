import { IGetDeveloperUnavailableSlotsUseCase } from "@/application/useCases/interfaces/user/availability/IGetDeveloperUnavailableSlotsUseCase";
import { AppError } from "@/domain/errors/AppError";
import { IDeveloperSlotRepository } from "@/domain/interfaces/IDeveloperSlotRepository";
import { StatusCodes } from "http-status-codes";

export class GetDeveloperUnavailableSlotsUseCase implements IGetDeveloperUnavailableSlotsUseCase {
  constructor(
    private _developerSlotRepository: IDeveloperSlotRepository
  ) { }

  async execute(developerId: string, date: Date): Promise<string[]> {
    try {
      return await this._developerSlotRepository.getUnavailableSlots(developerId, date);
    } catch (error) {
      console.error("Get unavailable slots error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
