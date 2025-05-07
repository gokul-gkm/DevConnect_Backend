import { IDeveloperSlotRepository } from "@/domain/interfaces/IDeveloperSlotRepository";
import DeveloperSlot, {IDeveloperSlot} from "@/domain/entities/Slot";
import mongoose from "mongoose";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { startOfDay, endOfDay } from "date-fns";
import Developer from "@/domain/entities/Developer";

export class DeveloperSlotRepository implements IDeveloperSlotRepository {
  async getUnavailableSlots(developerId: string, date: Date): Promise<string[]> {
    try {
      const dateToCheck = startOfDay(new Date(date));
      
      const record = await DeveloperSlot.findOne({
        developerId: new mongoose.Types.ObjectId(developerId),
        date: {
          $gte: startOfDay(dateToCheck),
          $lte: endOfDay(dateToCheck)
        }
      });
      
      const developer = await Developer.findOne({userId: developerId});
    
      const specificSlots = record ? record.unavailableSlots : [];
      const defaultSlots = developer && developer.defaultUnavailableSlots ? developer.defaultUnavailableSlots : [];
      
      const combinedSlots = [...new Set([...specificSlots, ...defaultSlots])];
      
      return combinedSlots;
    } catch (error) {
      console.error('Get unavailable slots error:', error);
      throw new AppError('Failed to get unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUnavailableSlots(developerId: string, date: Date, slots: string[]): Promise<IDeveloperSlot> {
    try {
        const dateToUpdate = startOfDay(new Date(date));
        
      const updatedRecord = await DeveloperSlot.findOneAndUpdate(
        {
          developerId: new mongoose.Types.ObjectId(developerId),
          date: {
            $gte: startOfDay(dateToUpdate),
            $lte: endOfDay(dateToUpdate)
          }
        },
        {
          $set: {
            developerId: new mongoose.Types.ObjectId(developerId),
            date: dateToUpdate,
            unavailableSlots: slots
          }
        },
        {
          new: true,
          upsert: true
        }
      );
      
      return updatedRecord;
    } catch (error) {
      console.error('Update unavailable slots error:', error);
      throw new AppError('Failed to update unavailable slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteOldRecords(beforeDate: Date): Promise<void> {
    try {
      await DeveloperSlot.deleteMany({
        date: { $lt: startOfDay(beforeDate) }
      });
    } catch (error) {
      console.error('Delete old records error:', error);
      throw new AppError('Failed to delete old records', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
