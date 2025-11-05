import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { IGetBookedSlotsUseCase } from "@/application/useCases/interfaces/user/session/IGetBookedSlotsUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class GetBookedSlotsUseCase implements IGetBookedSlotsUseCase {
    constructor(
        @inject(TYPES.ISessionRepository)
        private _sessionRepository: ISessionRepository
    ) { }

  async execute(developerId: string, date: string) {
    try {
      if (!developerId || !date) {
        throw new AppError(
          "Developer ID and date are required",
          StatusCodes.BAD_REQUEST
        );
      }

      const bookedSlots = await this._sessionRepository.getBookedSlots(
        developerId,
        new Date(date)
      );

      const formattedSlots = bookedSlots.map((slot: any) => ({
        startTime: slot.startTime,
        duration: slot.duration,
      }));

      return formattedSlots;
    } catch (error) {
      console.error("Get user booked slots error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to fetch user booked slots",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}
