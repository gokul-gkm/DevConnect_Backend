import { AppError } from "@/domain/errors/AppError";
import { MailService } from "@/infrastructure/mail/MailService";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { generatePasswordResetToken } from "@/shared/utils/TokenGenerator";

export class ForgotPasswordUseCase{
    constructor(private userRepository: UserRepository, private mailService: MailService) { }
    
    async execute(email: string): Promise<string> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError('User not found',400)
        }
        const resetToken = generatePasswordResetToken(user._id, email);
        const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
        await this.mailService.sendPasswordResetLink(email,resetLink)
        return resetToken
    }
}