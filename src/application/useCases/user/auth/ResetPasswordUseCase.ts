import { AppError } from "@/domain/errors/AppError";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface ResetPasswordDTO{
    token: string,
    newPassword: string
}

export class ResetPasswordUseCase{
    constructor(private userRepository: UserRepository) { }
    async execute(data: ResetPasswordDTO): Promise<void> {
        const { token, newPassword } = data;
        try {
            const decoded = jwt.verify(token, process.env.PASSWORD_RESET_SECRET as string) as {
                userId: string;
                email: string;
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.userRepository.update(decoded.userId,{password: hashedPassword})
        } catch (error) {
            throw new AppError('Invalid or expired reset token',400)
        }
    }
}