import { VerifyOTPDTO } from "@/application/dto/VerifyOTPDTO";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "@/utils/constants";
import { IOTPRepository } from "@/domain/interfaces/repositories/IOTPRepository";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { IVerifyOTPUseCase } from "@/application/useCases/interfaces/user/auth/IVerifyOTPUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class VerifyOTPUseCase implements IVerifyOTPUseCase {

    constructor(
        @inject(TYPES.IOTPRepository) private _otpRepository: IOTPRepository,
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
    ) { }

    async execute({ email, otp } : VerifyOTPDTO){
        const otpRecord = await this._otpRepository.findByEmail(email);

        if (!otpRecord) {
            throw new AppError('OTP not found', StatusCodes.BAD_REQUEST);
        }
        if (otpRecord.expiresAt < new Date()) {
            await this._otpRepository.deleteByEmail(email);
            throw new AppError('OTP has expired', StatusCodes.BAD_REQUEST)
        }
        if (otpRecord.attempts >= 3) {
            await this._otpRepository.deleteByEmail(email);
            throw new AppError('Too many attempts. Pleasen request a new OTP', StatusCodes.BAD_REQUEST)
        }
        if (otpRecord.otp != otp) {
            otpRecord.attempts += 1;
            await this._otpRepository.save(otpRecord);
            throw new AppError('Invalid OTP !!!', StatusCodes.BAD_REQUEST)
            return false;
        }

        const user = await this._userRepository.findByEmail(email);

        if (!user) {
            throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
        }
        user.isVerified = true;
        await this._userRepository.save(user);
    
        await this._otpRepository.deleteByEmail(email);
        return true;
    }
}