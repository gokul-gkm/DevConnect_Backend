import { inject, injectable } from "inversify";
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { TYPES } from "@/types/types";
import { ICheckUsernameAvailabilityUseCase } from "@/application/useCases/interfaces/user/auth/ICheckUsernameAvailabilityUseCase";

@injectable()
export class CheckUsernameAvailabilityUseCase implements ICheckUsernameAvailabilityUseCase {
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
