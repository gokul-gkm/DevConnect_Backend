import { ChangePasswordDTO } from "@/application/dto/users/ChangePasswordDTO";
import { AppError } from "@/domain/errors/AppError";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { StatusCodes } from "http-status-codes";
import bcrypt from 'bcryptjs'

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
                throw new AppError('User not found', StatusCodes.NOT_FOUND);
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isCurrentPasswordValid) {
                throw new AppError('Current password is incorrect', StatusCodes.UNAUTHORIZED);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await this.userRepository.update(userId, { password: hashedPassword });
            
            
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to Update the Password', StatusCodes.INTERNAL_SERVER_ERROR)
        }

    }
}