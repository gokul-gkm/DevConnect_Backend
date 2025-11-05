import { IGetUserDetailsUseCase } from "@/application/useCases/interfaces/admin/users/IGetUserDetailsUseCase";
import { IUser } from "@/domain/entities/User";
import { AppError } from "@/domain/errors/AppError";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { TYPES } from "@/types/types";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";

@injectable()
export class GetUserDetailsUseCase implements IGetUserDetailsUseCase {
    constructor(
        @inject(TYPES.IUserRepository)
        private _userRepository: IUserRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) { }

    async execute(userId: string): Promise<IUser | null> {
        const user = await this._userRepository.findById(userId);
        if (!user) {
            throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
        }
        
        if (user.profilePicture) {
            user.profilePicture = await this._s3Service.generateSignedUrl(user.profilePicture);
        }
        return user
    }
}