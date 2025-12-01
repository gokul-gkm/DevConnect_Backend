import { IOTP } from "@/domain/entities/OTP";
import { IBaseRepository } from "./IBaseRepository";

export interface IOTPRepository extends IBaseRepository<IOTP>{
    save(otp: IOTP): Promise<IOTP>;
    findByEmail(email: string): Promise<IOTP | null>;
    deleteByEmail(email: string): Promise<void>;
}