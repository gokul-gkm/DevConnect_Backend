import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { VerifyOTPDTO } from "@/application/dto/VerifyOTPDTO";
import { AppError } from "@/domain/errors/AppError";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { StatusCodes } from "http-status-codes";

export class VerifyOTPUseCase {
    private otpRepository: OTPRepository;
    private userRepository: UserRepository;

    constructor(otpRepository: OTPRepository, userRepository: UserRepository) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
    }

    async execute({ email, otp } : VerifyOTPDTO){
        const otpRecord = await this.otpRepository.findByEmail(email);

        if (!otpRecord) {
            throw new AppError('OTP not found', StatusCodes.BAD_REQUEST);
        }
        if (otpRecord.expiresAt < new Date()) {
            await this.otpRepository.deleteByEmail(email);
            throw new AppError('OTP has expired', StatusCodes.BAD_REQUEST)
        }
        if (otpRecord.attempts >= 3) {
            await this.otpRepository.deleteByEmail(email);
            throw new AppError('Too many attempts. Pleasen request a new OTP', StatusCodes.BAD_REQUEST)
        }
        if (otpRecord.otp != otp) {
            otpRecord.attempts += 1;
            await this.otpRepository.save(otpRecord);
            throw new AppError('Invalid OTP !!!', StatusCodes.BAD_REQUEST)
            return false;
        }

        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new AppError('User not found', StatusCodes.NOT_FOUND);
        }
        user.isVerified = true;
        await this.userRepository.save(user);
    
        await this.otpRepository.deleteByEmail(email);
        return true;
    }
}