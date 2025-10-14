import { AppError } from "@/domain/errors/AppError";
import { StatusCodes } from "http-status-codes";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { ERROR_MESSAGES } from "@/utils/constants";
import { IToggleUserStatusUseCase } from "@/application/useCases/interfaces/admin/users/IToggleUserStatusUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

@injectable()
export class ToggleUserStatusUseCase implements IToggleUserStatusUseCase {
    constructor(
        @inject(TYPES.IUserRepository)
        private _userRepository: IUserRepository
    ) { }

    async execute(userId: string): Promise<void> {
        const user = await this._userRepository.findById(userId);

        if (!user) {
            throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';

        await this._userRepository.save(user);
    }
}