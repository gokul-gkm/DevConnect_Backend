import { IUser } from "@/domain/entities/User";
import { AppError } from "@/domain/errors/AppError";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";
import { StatusCodes } from "http-status-codes";

export class GetUserDetailsUseCase {
    constructor(
        private userRepository: UserRepository,
        private s3Service: S3Service
    ) { }

    async execute(userId: string): Promise<IUser | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError('User not found', StatusCodes.NOT_FOUND);
        }
        
        if (user.profilePicture) {
            user.profilePicture = await this.s3Service.generateSignedUrl(user.profilePicture);
        }
        return user
    }
}