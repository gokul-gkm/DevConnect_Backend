import { IDeveloperRepository } from "@/domain/interfaces/IDeveloperRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IManageDefaultSlotsUseCase } from "@/application/useCases/interfaces/developer/availability/IManageDefaultSlotsUseCase";

export class ManageDefaultSlotsUseCase implements IManageDefaultSlotsUseCase {
  constructor(
    private _developerRepository: IDeveloperRepository
  ) {}

  async getDefaultUnavailableSlots(developerId: string): Promise<string[]> {
    try {
      return await this._developerRepository.getDefaultUnavailableSlots(developerId);
    } catch (error) {
      console.error("Get default unavailable slots error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get default unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateDefaultUnavailableSlots(developerId: string, slots: string[]): Promise<void> {
    try {
      await this._developerRepository.updateDefaultUnavailableSlots(developerId, slots);
    } catch (error) {
      console.error("Update default unavailable slots error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update default unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
} 