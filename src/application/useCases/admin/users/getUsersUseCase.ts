import { IUser } from "@/domain/entities/User";
import { PaginatedResponse, QueryParams } from "@/domain/types/types";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";

export class GetUsersUseCase {
    constructor(private userRepository: UserRepository) { }

    async execute(queryParams: QueryParams): Promise<PaginatedResponse <any>> {
        try {
            const result = await this.userRepository.findUsers(queryParams);
            return result
        } catch (error) {
            console.error('Error in GetUsersUseCase : ', error);
            throw error;
        }
    }
}