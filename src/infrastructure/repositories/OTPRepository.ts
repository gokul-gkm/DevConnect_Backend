import { OTP, IOTP } from "@/domain/entities/OTP";
import { AppError } from "@/domain/errors/AppError";
import { IOTPRepository } from "@/domain/interfaces/IOTPRepository";
import { StatusCodes } from "http-status-codes";
import { BaseRepository } from "./BaseRepository";


export class OTPRepository extends BaseRepository<IOTP> implements IOTPRepository{
    constructor() {
        super(OTP)
    }
    async save(otp: IOTP): Promise < IOTP > {
        try {
            return await otp.save();
        } catch (error) {
            console.error('Error saving OTP:', error);
            throw new AppError('Failed to save otp', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }
    async findByEmail(email: string): Promise<IOTP | null> {
        try {
            return await OTP.findOne({email})
        } catch (error) {
            console.error('Error fetching OTP:', error);
            throw new AppError('Failed to fetch otp', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }

    async deleteByEmail(email: string): Promise<void> {
        try {
            await OTP.deleteMany({email})
        } catch (error) {
            console.error('Error delete OTP:', error);
            throw new AppError('Failed to delete otp', StatusCodes.INTERNAL_SERVER_ERROR);
        }
        
    }
}