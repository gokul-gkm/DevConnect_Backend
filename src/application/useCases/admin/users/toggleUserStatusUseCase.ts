import { UserRepository } from "@/infrastructure/repositories/UserRepository";

export class ToggleUserStatusUseCase {
    constructor(private userRepository: UserRepository) { }

    async execute(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';

        await this.userRepository.save(user);
    }
}