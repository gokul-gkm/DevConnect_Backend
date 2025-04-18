import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";

export class ToggleUserStatusUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new AppError('User not found', StatusCodes.NOT_FOUND);
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';

        await this.userRepository.save(user);
    }
}