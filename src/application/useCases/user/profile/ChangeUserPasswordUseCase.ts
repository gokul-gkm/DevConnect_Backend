import { ChangePasswordDTO } from "@/application/dto/users/ChangePasswordDTO";
import { AppError } from "@/domain/errors/AppError";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { StatusCodes } from "http-status-codes";
import bcrypt from 'bcryptjs'
import { ERROR_MESSAGES } from "@/utils/constants";

export class ChangeUserPasswordUseCase {
    constructor(private userRepository: IUserRepository) { }
    
    async execute(userId: string, data: ChangePasswordDTO): Promise<void> {
        try {
            const { currentPassword, newPassword, confirmPassword, } = data
            if (newPassword !== confirmPassword) {
                throw new AppError('Passwords do not match', StatusCodes.BAD_REQUEST)
            }
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isCurrentPasswordValid) {
                throw new AppError('Current password is incorrect', StatusCodes.UNAUTHORIZED);
            }

            if (currentPassword == newPassword) {
                throw new AppError('New password should not be the same as the current password.', StatusCodes.BAD_REQUEST)
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await this.userRepository.update(userId, { password: hashedPassword });
            
            
        } catch (error: any) {

            throw new AppError(
                error.message || 'Failed to Update the Password',
                error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
            );
        }

    }
}