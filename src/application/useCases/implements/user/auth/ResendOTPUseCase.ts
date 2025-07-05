import { IResendOTPUseCase } from "@/application/useCases/interfaces/user/auth/IResendOTPUseCase";
import { OTP } from "@/domain/entities/OTP";
import { AppError } from "@/domain/errors/AppError";
import { IMailService } from "@/domain/interfaces/IMailService";
import { IOTPRepository } from "@/domain/interfaces/IOTPRepository";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { generateOTP } from "@/shared/utils/OTPGenerator";
import { StatusCodes } from "http-status-codes";

export class ResendOTPUseCase implements IResendOTPUseCase{

    constructor(
        private _otpRepository: IOTPRepository,
        private _mailService: IMailService,
        private _userRepository: IUserRepository
    ) { }
    
    async execute(email: string): Promise<void> {

        const user = await this._userRepository.findByEmail(email)

        if (!user) {
            throw new AppError('If a user with this email exists, a new OTP will be sent', StatusCodes.BAD_REQUEST)
        }
        if (user.isVerified) {
            throw new AppError('Email is already verified', StatusCodes.BAD_REQUEST)
        }

        const existingOTP = await this._otpRepository.findByEmail(email);

        if (existingOTP) {
            const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
            const MIN_TIME_BETWEEN_OTPS = 1 * 60 * 1000;

            if (timeSinceLastOTP < MIN_TIME_BETWEEN_OTPS) {
                throw new AppError(`Please wait ${Math.ceil((MIN_TIME_BETWEEN_OTPS - timeSinceLastOTP) / 1000)} seconds before requesting a new OTP`, 429);
            }
            await this._otpRepository.deleteByEmail(email);
        }

        const newOTP = generateOTP();
        console.log('Resend OTP : ', newOTP);     

        const otpRecord = new OTP({
            email,
            otp: newOTP,
            createdAt: Date.now(),
            expiresAt: new Date(Date.now() + 1 * 60 * 1000)
        })

        await this._otpRepository.save(otpRecord);
        try {
            await this._mailService.sendOTP(email, newOTP);
        } catch (error) {
            await this._otpRepository.deleteByEmail(email);
            throw new AppError('Failed to send OTP email', StatusCodes.INTERNAL_SERVER_ERROR)
        }
        
    }
}