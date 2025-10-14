import { IDeveloperSlotRepository } from "@/domain/interfaces/IDeveloperSlotRepository";
import { ISessionRepository } from "@/domain/interfaces/ISessionRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IManageDeveloperUnavailabilityUseCase } from "@/application/useCases/interfaces/developer/availability/IManageDeveloperUnavailabilityUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class ManageDeveloperUnavailabilityUseCase implements IManageDeveloperUnavailabilityUseCase {
  constructor(
    @inject(TYPES.IDeveloperSlotRepository) private _developerSlotRepository: IDeveloperSlotRepository,
    @inject(TYPES.ISessionRepository) private _sessionRepository: ISessionRepository
  ) {}

  async getUnavailableSlots(developerId: string, date: Date): Promise<string[]> {
    try {
      return await this._developerSlotRepository.getUnavailableSlots(developerId, date);
    } catch (error) {
      console.error("Get unavailable slots error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUnavailableSlots(developerId: string, date: Date, slots: string[]): Promise<void> {
    try {
      for (const slot of slots) {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);
        
        const isAvailable = await this._sessionRepository.checkSlotAvailability(
          developerId,
          date,
          slotTime,
          30 
        );
        
        if (!isAvailable) {
          throw new AppError(
            `Cannot mark slot ${slot} as unavailable because there's a scheduled session`,
            StatusCodes.BAD_REQUEST
          );
        }
      }
      
      await this._developerSlotRepository.updateUnavailableSlots(developerId, date, slots);
    } catch (error) {
      console.error("Update unavailable slots error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async cleanUpOldRecords(): Promise<void> {
    try {
      const today = new Date();
      await this._developerSlotRepository.deleteOldRecords(today);
    } catch (error) {
      console.error("Clean up old records error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to clean up old records', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
