import { IUser } from "@/domain/entities/User";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";

export class GetUserDetailsUseCase {
    constructor(private userRepository: UserRepository) { }

    async execute(userId: string): Promise<IUser | null> {
        return await this.userRepository.findById(userId);
    }
}