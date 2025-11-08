import { RegisterUserDTO } from "@/application/dto/users/RegisterUserDTO";

export interface IRegisterDevUseCase{
    execute(userData: RegisterUserDTO): Promise<{expiresAt: Date}>
}