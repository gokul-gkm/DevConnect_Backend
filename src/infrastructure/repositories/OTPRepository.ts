import { OTP, IOTP } from "@/domain/entities/OTP";
import { IOTPRepository } from "@/domain/interfaces/IOTPRepository";


export class OTPRepository implements IOTPRepository{
    async save(otp: IOTP): Promise<IOTP>{
        return await otp.save();
    }
    async findByEmail(email: string): Promise<IOTP | null> {
        return await OTP.findOne({email})
    }

    async deleteByEmail(email: string): Promise<void> {
        await OTP.deleteMany({email})
    }
}