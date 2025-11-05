import { IForgotPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IForgotPasswordUseCase";
import { AppError } from "@/domain/errors/AppError";
import { IMailService } from "@/domain/interfaces/services/IMailService";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { generatePasswordResetToken } from "@/shared/utils/TokenGenerator";
import { TYPES } from "@/types/types";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";

@injectable()
export class ForgotPasswordUseCase implements IForgotPasswordUseCase{
    constructor(
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
        @inject(TYPES.IMailService) private _mailService: IMailService
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