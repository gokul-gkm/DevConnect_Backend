import { RegisterUserDTO } from "@/application/dto/users/RegisterUserDTO";

export interface IRegisterUserUseCase{
    execute(userData: RegisterUserDTO): Promise<{ expiresAt: Date }>
}