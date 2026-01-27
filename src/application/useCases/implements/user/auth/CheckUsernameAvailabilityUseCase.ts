import { inject, injectable } from "inversify";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { TYPES } from "@/types/types";

@injectable()
export class CheckUsernameAvailabilityUseCase {
  constructor(
    @inject(TYPES.IUserRepository)
    private readonly _userRepository: IUserRepository
  ) {}

  async execute(username: string, excludeUserId?: string): Promise<boolean> {
    const normalizedUsername = username

    const user = await this._userRepository.findByUsername(normalizedUsername);
    
    if (user) {
        if (excludeUserId && user._id.toString() === excludeUserId) {
            return true;
        }
    }
    
    return !user;
  }
}
