import { IGetUserDetailsUseCase } from "@/application/useCases/interfaces/admin/users/IGetUserDetailsUseCase";
import { IUser } from "@/domain/entities/User";
import { AppError } from "@/domain/errors/AppError";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { ERROR_MESSAGES } from "@/utils/constants";
import { StatusCodes } from "http-status-codes";

export class GetUserDetailsUseCase implements IGetUserDetailsUseCase {
    constructor(
        private _userRepository: IUserRepository,
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