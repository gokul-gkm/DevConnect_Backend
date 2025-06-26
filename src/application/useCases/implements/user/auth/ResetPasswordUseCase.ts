import { AppError } from "@/domain/errors/AppError";
import bcrypt from 'bcryptjs'
import { StatusCodes } from "http-status-codes";
import jwt from 'jsonwebtoken'
import { ResetPasswordDTO } from "@/application/dto/users/ResetPasswordDTO";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { IResetPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IResetPasswordUseCase";


export class ResetPasswordUseCase implements IResetPasswordUseCase{
    constructor(
        private _userRepository: IUserRepository
    ) { }
    async execute(data: ResetPasswordDTO): Promise<void> {
        const { token, newPassword } = data;
        try {
            const decoded = jwt.verify(token, process.env.PASSWORD_RESET_SECRET as string) as {
                userId: string;
                email: string;
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this._userRepository.update(decoded.userId,{password: hashedPassword})
        } catch (error) {
            throw new AppError('Invalid or expired reset token',StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }
}