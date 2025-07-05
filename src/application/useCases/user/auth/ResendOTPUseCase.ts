import { OTP } from "@/domain/entities/OTP";
import { AppError } from "@/domain/errors/AppError";
import { MailService } from "@/infrastructure/mail/MailService";
import { OTPRepository } from "@/infrastructure/repositories/OTPRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { generateOTP } from "@/shared/utils/OTPGenerator";
import { StatusCodes } from "http-status-codes";

export class ResendOTPUseCase{

    constructor(private otpRepository: OTPRepository, private mailService: MailService,private userRepository: UserRepository) { }
    
    async execute(email: string): Promise<void> {

        const user = await this.userRepository.findByEmail(email)

        if (!user) {
            throw new AppError('If a user with this email exists, a new OTP will be sent', StatusCodes.BAD_REQUEST)
        }
        if (user.isVerified) {
            throw new AppError('Email is already verified', StatusCodes.BAD_REQUEST)
        }

        const existingOTP = await this.otpRepository.findByEmail(email);

        if (existingOTP) {
            const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
            const MIN_TIME_BETWEEN_OTPS = 1 * 60 * 1000;

            if (timeSinceLastOTP < MIN_TIME_BETWEEN_OTPS) {
                throw new AppError(`Please wait ${Math.ceil((MIN_TIME_BETWEEN_OTPS - timeSinceLastOTP) / 1000)} seconds before requesting a new OTP`, 429);
            }
            await this.otpRepository.deleteByEmail(email);
        }

        const newOTP = generateOTP();
        console.log('Resend OTP : ', newOTP);     

        const otpRecord = new OTP({
            email,
            otp: newOTP,
            createdAt: Date.now(),
            expiresAt: new Date(Date.now() + 1 * 60 * 1000)
        })

        await this.otpRepository.save(otpRecord);
        try {
            await this.mailService.sendOTP(email, newOTP);
        } catch (error) {
            await this.otpRepository.deleteByEmail(email);
            throw new AppError('Failed to send OTP email', StatusCodes.INTERNAL_SERVER_ERROR)
        }
        
    }
}