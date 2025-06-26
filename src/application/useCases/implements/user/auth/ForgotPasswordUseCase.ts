import { IForgotPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IForgotPasswordUseCase";
import { AppError } from "@/domain/errors/AppError";
import { IMailService } from "@/domain/interfaces/IMailService";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { generatePasswordResetToken } from "@/shared/utils/TokenGenerator";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";

export class ForgotPasswordUseCase implements IForgotPasswordUseCase{
    constructor(
        private _userRepository: IUserRepository,
        private _mailService: IMailService
    ) { }
    
    async execute(email: string): Promise<string> {
        const user = await this._userRepository.findByEmail(email);
        if (!user) {
            throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND,StatusCodes.BAD_REQUEST)
        }
        const resetToken = generatePasswordResetToken(user._id, email);
        const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
        await this._mailService.sendPasswordResetLink(email,resetLink)
        return resetToken
    }
}