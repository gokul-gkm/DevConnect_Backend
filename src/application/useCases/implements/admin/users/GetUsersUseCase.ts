import { IGetUsersUseCase } from "@/application/useCases/interfaces/admin/users/IGetUsersUseCase";
import { IS3Service } from "@/domain/interfaces/IS3Service";
import { IUserRepository } from "@/domain/interfaces/IUserRepository";
import { PaginatedResponse, QueryParams } from "@/domain/types/types";
import { TYPES } from "@/types/types";
import { inject, injectable } from "inversify";

@injectable()
export class GetUsersUseCase implements IGetUsersUseCase {
    constructor(
        @inject(TYPES.IUserRepository)
        private _userRepository: IUserRepository,
        @inject(TYPES.IS3Service)
        private _s3Service: IS3Service
    ) { }

    async execute(queryParams: QueryParams): Promise<PaginatedResponse <any>> {
        try {
            const result = await this._userRepository.findUsers(queryParams);

            result.data = await Promise.all(
                result.data.map(async (user) => {
                    if (user.profilePicture) {
                        try {
                            user.profilePicture = await this._s3Service.generateSignedUrl(user.profilePicture);
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