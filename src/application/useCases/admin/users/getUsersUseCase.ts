import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { PaginatedResponse, QueryParams } from "@/domain/types/types";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

export class GetUsersUseCase {
    constructor(
        private userRepository: IUserRepository,
        private s3Service: S3Service
    ) { }

    async execute(queryParams: QueryParams): Promise<PaginatedResponse <any>> {
        try {
            const result = await this.userRepository.findUsers(queryParams);

            result.data = await Promise.all(
                result.data.map(async (user) => {
                    if (user.profilePicture) {
                        try {
                            user.profilePicture = await this.s3Service.generateSignedUrl(user.profilePicture);
                        } catch (error) {
                            console.error('Error getting signed URL:', error);
                            user.profilePicture = null;
                        }
                    }
                    return user;
                })
            );

            return result;
        } catch (error) {
            console.error('Error in GetUsersUseCase : ', error);
            throw error;
        }
    }
}