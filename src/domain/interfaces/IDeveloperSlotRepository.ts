import { IDeveloperSlot } from "@/domain/entities/Slot";
import { IBaseRepository } from "./IBaseRepository";

export interface IDeveloperSlotRepository extends IBaseRepository<IDeveloperSlot> {
  getUnavailableSlots(developerId: string, date: Date): Promise<string[]>;
  updateUnavailableSlots(
    developerId: string,
    date: Date,
    slots: string[]
  ): Promise<IDeveloperSlot>;
  deleteOldRecords(beforeDate: Date): Promise<void>;
}
