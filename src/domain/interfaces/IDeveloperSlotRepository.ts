import { IDeveloperSlot } from "@/domain/entities/Slot";

export interface IDeveloperSlotRepository {
  getUnavailableSlots(developerId: string, date: Date): Promise<string[]>;
  updateUnavailableSlots(
    developerId: string,
    date: Date,
    slots: string[]
  ): Promise<IDeveloperSlot>;
  deleteOldRecords(beforeDate: Date): Promise<void>;
}
