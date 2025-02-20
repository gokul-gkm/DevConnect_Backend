import { OTP, IOTP } from "@/domain/entities/OTP";
import { AppError } from "@/domain/errors/AppError";
import { IOTPRepository } from "@/domain/interfaces/IOTPRepository";


export class OTPRepository implements IOTPRepository{
    
    async save(otp: IOTP): Promise < IOTP > {
        try {
            return await otp.save();
        } catch (error) {
            console.error('Error saving OTP:', error);
            throw new AppError('Failed to save otp', 500);
        }
        
    }
    async findByEmail(email: string): Promise<IOTP | null> {
        try {
            return await OTP.findOne({email})
        } catch (error) {
            console.error('Error fetching OTP:', error);
            throw new AppError('Failed to fetch otp', 500);
        }
        
    }

    async deleteByEmail(email: string): Promise<void> {
        try {
            await OTP.deleteMany({email})
        } catch (error) {
            console.error('Error delete OTP:', error);
            throw new AppError('Failed to delete otp', 500);
        }
        
    }
}