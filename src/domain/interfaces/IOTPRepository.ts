import { IOTP } from "../entities/OTP";

export interface IOTPRepository{
    save(otp: IOTP): Promise<IOTP>;
    findByEmail(email: string): Promise<IOTP | null>;
    deleteByEmail(email: string): Promise<void>;
}